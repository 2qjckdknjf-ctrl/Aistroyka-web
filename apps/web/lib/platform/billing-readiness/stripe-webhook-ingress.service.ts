/**
 * Stripe webhook ingress service (Step 17, Step 18).
 * Raw event -> verify -> translate -> record -> process.
 * Step 18: webhook processing gated by workspace pilot eligibility.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { verifyStripeWebhookSignature, isStripeWebhookIngressReady } from "./stripe-webhook-verification";
import { createBillingEventRecord, getBillingEventByProviderRef } from "./billing-readiness.repository";
import { processBillingEventRecord } from "./billing-event-processor.service";
import { stripeBillingAdapter } from "./billing-adapter-stripe";
import { STRIPE_EVENT_TYPES } from "./billing-adapter-stripe";
import { resolveBillingPilotEligibility } from "./billing-pilot-resolution.service";

const SUPPORTED_EVENT_TYPES: Set<string> = new Set([
  STRIPE_EVENT_TYPES.CHECKOUT_COMPLETED,
  STRIPE_EVENT_TYPES.CHECKOUT_EXPIRED,
  STRIPE_EVENT_TYPES.SUBSCRIPTION_CREATED,
  STRIPE_EVENT_TYPES.SUBSCRIPTION_UPDATED,
  STRIPE_EVENT_TYPES.SUBSCRIPTION_DELETED,
]);

export type WebhookIngressResult =
  | { status: "processed"; eventId: string; processingStatus: string }
  | { status: "duplicate"; eventId?: string }
  | { status: "skipped"; reason: string }
  | { status: "rejected"; reason: string };

/**
 * Ingest Stripe webhook: verify, record, process.
 * Idempotent: duplicate provider_event_ref returns duplicate status.
 */
export async function ingestStripeWebhook(
  supabase: SupabaseClient,
  rawBody: string,
  signature: string | null
): Promise<WebhookIngressResult> {
  if (!isStripeWebhookIngressReady()) {
    return { status: "rejected", reason: "Webhook ingress not enabled or config invalid" };
  }

  const event = verifyStripeWebhookSignature(rawBody, signature);
  if (!event) {
    return { status: "rejected", reason: "Invalid signature" };
  }

  const providerEventRef = event.id;
  const eventType = event.type;

  const existing = await getBillingEventByProviderRef(supabase, "stripe", providerEventRef);
  if (existing) {
    return { status: "duplicate", eventId: existing.id };
  }

  if (!SUPPORTED_EVENT_TYPES.has(eventType)) {
    return { status: "skipped", reason: `Unsupported event type: ${eventType}` };
  }

  const payload = event as unknown as Record<string, unknown>;
  const workspaceId = extractWorkspaceId(payload);

  const { data: record, error: createErr } = await createBillingEventRecord(supabase, {
    workspaceId,
    billingProvider: "stripe",
    providerEventRef,
    eventType,
    eventPayloadSnapshot: payload,
  });

  if (createErr) {
    if (createErr.includes("duplicate") || createErr.includes("unique") || createErr.includes("23505")) {
      return { status: "duplicate" };
    }
    return { status: "rejected", reason: createErr };
  }

  if (!record) {
    return { status: "rejected", reason: "Failed to create event record" };
  }

  let webhookProcessingEligible = false;
  if (workspaceId) {
    const pilot = await resolveBillingPilotEligibility(supabase, workspaceId);
    webhookProcessingEligible = pilot.webhookProcessingEligible;
  }

  if (!webhookProcessingEligible) {
    const processingStatus = workspaceId ? "skipped_pilot_not_eligible" : "skipped_missing_workspace";
    return { status: "processed", eventId: record.id, processingStatus };
  }

  const result = await processBillingEventRecord(supabase, record.id, stripeBillingAdapter);

  return {
    status: "processed",
    eventId: record.id,
    processingStatus: result.status,
  };
}

function extractWorkspaceId(payload: Record<string, unknown>): string | null {
  const obj = (payload?.data as Record<string, unknown>)?.object ?? payload?.object;
  const meta = obj as Record<string, unknown> | undefined;
  const wid = meta?.metadata as Record<string, string> | undefined;
  return (wid?.workspace_id as string) ?? null;
}
