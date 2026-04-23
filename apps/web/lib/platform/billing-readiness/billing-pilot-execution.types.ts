/**
 * E2E pilot execution status model (Step 20).
 * Canonical stages for controlled pilot verification.
 * No access enforcement; observability only.
 */

import type { BillingPilotMode } from "./billing-pilot.types";

/** Canonical E2E pilot execution stage. */
export type BillingPilotExecutionStage =
  | "pilot_not_eligible"
  | "ready_for_checkout"
  | "checkout_created"
  | "awaiting_provider_completion"
  | "return_received_optional"
  | "webhook_received"
  | "event_processed"
  | "subscription_state_updated"
  | "pilot_verified"
  | "pilot_needs_attention"
  | "cancelled"
  | "failed";

/** Attention/failure reason for operator. */
export type BillingPilotAttentionReason =
  | "checkout_created_no_webhook_timeout"
  | "webhook_failed_processing"
  | "subscription_missing_after_checkout"
  | "workspace_not_eligible"
  | "provider_misconfigured"
  | "conflicting_statuses"
  | "failed_events_pending"
  | "pending_events_stale"
  | "unknown";

/** Operator action key for pilot execution. */
export type BillingPilotOperatorAction =
  | "open_billing_overview"
  | "inspect_diagnostics"
  | "reprocess_failed_event"
  | "reprocess_pending_events"
  | "confirm_pilot_cohort"
  | "see_adapter_mode"
  | "start_checkout"
  | "await_webhook"
  | "no_action";

export interface BillingPilotExecutionStatus {
  workspaceId: string;
  /** Current E2E stage. */
  stage: BillingPilotExecutionStage;
  /** Mode: sandbox, provider_stub, provider_live. */
  mode: BillingPilotMode;
  /** Pilot eligible for live checkout. */
  pilotEligible: boolean;
  /** Latest checkout session summary. */
  latestCheckout: {
    id: string;
    status: string;
    targetPlanCode: string;
    providerSessionRef: string | null;
    createdAt: string;
  } | null;
  /** Latest billing subscription. */
  currentSubscription: {
    id: string;
    status: string;
    canonicalPlanCode: string;
    billingProvider: string;
    providerSubscriptionRef: string | null;
  } | null;
  /** Latest relevant webhook event. */
  latestRelevantEvent: {
    id: string;
    eventType: string;
    processingStatus: string;
    receivedAt: string;
    errorInfo: string | null;
  } | null;
  /** Event counts for workspace. */
  eventCounts: { pending: number; processed: number; failed: number; skipped: number };
  /** Needs-attention flags. */
  attentionReasons: BillingPilotAttentionReason[];
  /** Suggested next operator step. */
  suggestedOperatorAction: BillingPilotOperatorAction;
  /** Human-readable next step hint. */
  suggestedOperatorHint: string | null;
  /** Last failure reason if any. */
  lastFailureReason: string | null;
  /** Whether this is sandbox (no live) vs live pilot. */
  isSandbox: boolean;
}

/** Pilot verified policy: what must hold. Does NOT imply access enforcement. */
export interface BillingPilotVerificationPolicy {
  workspaceEligible: boolean;
  checkoutSessionCreatedInLiveMode: boolean;
  providerWebhookReceivedAndProcessed: boolean;
  billingSubscriptionStatusUpdated: boolean;
  diagnosticsConsistent: boolean;
  noAccessEnforcementChanged: true;
}
