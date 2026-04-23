/**
 * Billing event processor model (Step 14).
 * Canonical translated event and processing result types.
 */

import type { PlanCode } from "@aistroyka/contracts";
import type { BillingEvent, BillingProviderKind, BillingCycle } from "./billing-readiness.types";

// ─── Translated event (provider-agnostic) ───────────────────────────────────

export interface BillingTranslatedEvent {
  providerKind: BillingProviderKind;
  providerEventRef: string | null;
  eventType: string;
  workspaceId: string | null;
  checkoutSessionId: string | null;
  subscriptionId: string | null;
  targetPlanCode: PlanCode | null;
  occurredAt: string;
  payload: Record<string, unknown>;
  reconciliationHint: BillingEventReconciliationHint | null;
}

export type BillingEventReconciliationHint =
  | { action: "checkout_complete"; sessionId: string; planCode: PlanCode; billingCycle: BillingCycle }
  | { action: "checkout_cancel"; sessionId: string }
  | { action: "subscription_activate"; workspaceId: string; planCode: PlanCode; billingCycle: BillingCycle }
  | { action: "subscription_cancel"; workspaceId: string | null; providerSubscriptionRef?: string | null }
  | { action: "subscription_pause"; workspaceId: string };

// ─── Processing result ───────────────────────────────────────────────────────

export type BillingEventProcessorStatus = "processed" | "skipped" | "failed" | "noop";

export interface BillingEventProcessingResult {
  status: BillingEventProcessorStatus;
  eventId: string;
  updatedSubscriptionId: string | null;
  updatedCheckoutSessionId: string | null;
  notes: string[];
  idempotentHit: boolean;
  error?: string;
}

// ─── Processor input ────────────────────────────────────────────────────────

export interface BillingEventProcessorInput {
  eventId: string;
  event: BillingEvent;
  translated: BillingTranslatedEvent | null;
}
