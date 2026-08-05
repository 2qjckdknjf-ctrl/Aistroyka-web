/**
 * Stripe webhook ingress service (Step 17, Step 18).
 * Raw event -> verify -> translate -> record -> process.
 * Step 18: webhook processing gated by workspace pilot eligibility.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { verifyStripeWebhookSignature, isStripeWebhookIngressReady } from "./stripe-webhook-verification";
import {
  createBillingEventRecord,
  getBillingEventByProviderRef,
  markBillingEventProcessed,
} from "./billing-readiness.repository";
import { processBillingEventRecord, reprocessBillingEvent } from "./billing-event-processor.service";
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
  | { status: "rejected"; reason: string }
  | { status: "failed"; eventId: string; reason: string };

/**
 * Ingest Stripe webhook: verify, record, process.
 * Idempotent: already-processed/skipped provider_event_ref returns duplicate.
 * Failed/pending rows are re-applied so Stripe retries recover write loss.
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
    if (existing.processingStatus === "processed" || existing.processingStatus === "skipped") {
      return { status: "duplicate", eventId: existing.id };
    }
    // pending/failed: re-apply so Stripe retries (or crash mid-process) can recover.
    const retry =
      existing.processingStatus === "failed"
        ? await reprocessBillingEvent(supabase, existing.id)
        : await processBillingEventRecord(supabase, existing.id, stripeBillingAdapter);
    if (retry.status === "failed") {
      return {
        status: "failed",
        eventId: existing.id,
        reason: retry.error ?? "Processing failed",
      };
    }
    return {
      status: "processed",
      eventId: existing.id,
      processingStatus: retry.status,
    };
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
      // Concurrent insert: load winner and apply same duplicate/retry rules.
      const raced = await getBillingEventByProviderRef(supabase, "stripe", providerEventRef);
      if (raced) {
        if (raced.processingStatus === "processed" || raced.processingStatus === "skipped") {
          return { status: "duplicate", eventId: raced.id };
        }
        const retry =
          raced.processingStatus === "failed"
            ? await reprocessBillingEvent(supabase, raced.id)
            : await processBillingEventRecord(supabase, raced.id, stripeBillingAdapter);
        if (retry.status === "failed") {
          return { status: "failed", eventId: raced.id, reason: retry.error ?? "Processing failed" };
        }
        return { status: "processed", eventId: raced.id, processingStatus: retry.status };
      }
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
    await markBillingEventProcessed(supabase, record.id, "skipped", processingStatus);
    return { status: "processed", eventId: record.id, processingStatus };
  }

  const result = await processBillingEventRecord(supabase, record.id, stripeBillingAdapter);

  if (result.status === "failed") {
    return {
      status: "failed",
      eventId: record.id,
      reason: result.error ?? "Processing failed",
    };
  }

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
