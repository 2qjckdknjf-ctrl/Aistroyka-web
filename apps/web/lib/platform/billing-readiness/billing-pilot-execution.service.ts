/**
 * E2E pilot execution status service (Step 20).
 * Aggregates billing state into canonical execution stage + operator guidance.
 * No access enforcement; observability only.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getBillingPilotDiagnostics } from "./billing-pilot-resolution.service";
import { getBillingAdapterDiagnostics } from "./billing-adapter-registry";
import {
  getLatestBillingCheckoutSessionByWorkspace,
  getCurrentBillingSubscription,
  getBillingEventsByWorkspace,
  getBillingEventCountsByWorkspace,
} from "./billing-readiness.repository";
import type {
  BillingPilotExecutionStatus,
  BillingPilotExecutionStage,
  BillingPilotAttentionReason,
  BillingPilotOperatorAction,
} from "./billing-pilot-execution.types";
import type {
  BillingCheckoutSession,
  BillingSubscription,
  BillingEvent,
} from "./billing-readiness.types";

/** Minutes after checkout creation with no webhook → attention. */
const WEBHOOK_TIMEOUT_MINUTES = 15;

function toCheckoutSummary(
  s: BillingCheckoutSession | null
): BillingPilotExecutionStatus["latestCheckout"] {
  if (!s) return null;
  return {
    id: s.id,
    status: s.status,
    targetPlanCode: s.targetPlanCode,
    providerSessionRef: s.providerSessionRef,
    createdAt: s.createdAt,
  };
}

function toSubscriptionSummary(
  s: BillingSubscription | null
): BillingPilotExecutionStatus["currentSubscription"] {
  if (!s) return null;
  return {
    id: s.id,
    status: s.status,
    canonicalPlanCode: s.canonicalPlanCode,
    billingProvider: s.billingProvider,
    providerSubscriptionRef: s.providerSubscriptionRef,
  };
}

function toEventSummary(e: BillingEvent): BillingPilotExecutionStatus["latestRelevantEvent"] {
  return {
    id: e.id,
    eventType: e.eventType,
    processingStatus: e.processingStatus,
    receivedAt: e.receivedAt,
    errorInfo: e.errorInfo,
  };
}

/**
 * Resolve E2E pilot execution stage from aggregated state.
 */
export function resolveBillingPilotExecutionStage(input: {
  inPilotCohort: boolean;
  pilotEligible: boolean;
  mode: string;
  latestCheckout: BillingCheckoutSession | null;
  currentSubscription: BillingSubscription | null;
  recentEvents: BillingEvent[];
  eventCounts: { pending: number; processed: number; failed: number; skipped: number };
  lastFailureReason: string | null;
}): {
  stage: BillingPilotExecutionStage;
  attentionReasons: BillingPilotAttentionReason[];
  suggestedAction: BillingPilotOperatorAction;
  suggestedHint: string | null;
} {
  const {
    inPilotCohort,
    pilotEligible,
    mode,
    latestCheckout,
    currentSubscription,
    recentEvents,
    eventCounts,
    lastFailureReason,
  } = input;

  const attentionReasons: BillingPilotAttentionReason[] = [];
  let stage: BillingPilotExecutionStage = "ready_for_checkout";
  let suggestedAction: BillingPilotOperatorAction = "no_action";
  let suggestedHint: string | null = null;

  if (!inPilotCohort) {
    stage = "pilot_not_eligible";
    suggestedAction = "confirm_pilot_cohort";
    suggestedHint = "Add workspace to pilot cohort to run live E2E.";
    return { stage, attentionReasons, suggestedAction, suggestedHint };
  }

  if (mode === "provider_stub") {
    stage = "ready_for_checkout";
    suggestedAction = "see_adapter_mode";
    suggestedHint = "Live checkout disabled or provider misconfigured.";
    return { stage, attentionReasons, suggestedAction, suggestedHint };
  }

  if (eventCounts.failed > 0) {
    attentionReasons.push("failed_events_pending");
    stage = "pilot_needs_attention";
    suggestedAction = "reprocess_failed_event";
    suggestedHint = "Reprocess failed events from diagnostics.";
  }

  if (lastFailureReason && attentionReasons.length === 0) {
    attentionReasons.push("webhook_failed_processing");
    if (stage === "ready_for_checkout") stage = "pilot_needs_attention";
    suggestedAction = "reprocess_failed_event";
    suggestedHint = lastFailureReason;
  }

  if (latestCheckout) {
    const coStatus = latestCheckout.status;
    const hasProviderRef = Boolean(latestCheckout.providerSessionRef);
    const checkoutCreatedAt = new Date(latestCheckout.createdAt).getTime();
    const now = Date.now();
    const minutesSinceCheckout = (now - checkoutCreatedAt) / (60 * 1000);

    const completedEvent = recentEvents.find(
      (e) =>
        (e.eventType === "checkout.session.completed" || e.eventType?.includes("checkout_complete")) &&
        e.processingStatus === "processed"
    );
    const cancelledEvent = recentEvents.find(
      (e) =>
        (e.eventType === "checkout.session.expired" || e.eventType?.includes("checkout_cancel")) &&
        e.processingStatus === "processed"
    );
    const failedCheckoutEvent = recentEvents.find(
      (e) =>
        (e.eventType === "checkout.session.completed" || e.eventType?.includes("checkout")) &&
        e.processingStatus === "failed"
    );

    if (["cancelled", "expired"].includes(coStatus) || cancelledEvent) {
      stage = "cancelled";
      suggestedAction = "no_action";
      suggestedHint = "Checkout was cancelled or expired.";
      return { stage, attentionReasons, suggestedAction, suggestedHint };
    }

    if (coStatus === "failed" || failedCheckoutEvent) {
      stage = "failed";
      attentionReasons.push("webhook_failed_processing");
      suggestedAction = "reprocess_failed_event";
      suggestedHint = lastFailureReason ?? "Checkout or event processing failed.";
      return { stage, attentionReasons, suggestedAction, suggestedHint };
    }

    if (coStatus === "completed") {
      if (currentSubscription && ["active", "trialing", "past_due"].includes(currentSubscription.status)) {
        stage = "pilot_verified";
        suggestedAction = "no_action";
        suggestedHint = "Pilot E2E verified. No access enforcement changed.";
      } else if (completedEvent) {
        stage = "subscription_state_updated";
        suggestedAction = "inspect_diagnostics";
        suggestedHint = "Check subscription status in overview.";
      } else {
        stage = "event_processed";
        suggestedAction = "inspect_diagnostics";
      }
      return { stage, attentionReasons, suggestedAction, suggestedHint };
    }

    if (["created", "pending_redirect"].includes(coStatus)) {
      if (hasProviderRef) {
        if (completedEvent) {
          stage = "subscription_state_updated";
          if (currentSubscription && ["active", "trialing"].includes(currentSubscription.status)) {
            stage = "pilot_verified";
          }
          suggestedAction = "inspect_diagnostics";
        } else if (cancelledEvent) {
          stage = "cancelled";
        } else if (minutesSinceCheckout > WEBHOOK_TIMEOUT_MINUTES) {
          stage = "pilot_needs_attention";
          attentionReasons.push("checkout_created_no_webhook_timeout");
          suggestedAction = "await_webhook";
          suggestedHint = `Checkout created ${Math.floor(minutesSinceCheckout)} min ago. Webhook may be delayed or missing.`;
        } else {
          stage = "awaiting_provider_completion";
          suggestedAction = "await_webhook";
          suggestedHint = "User at provider. Await webhook or return.";
        }
      } else {
        stage = "checkout_created";
        suggestedAction = "inspect_diagnostics";
        suggestedHint = "Checkout session created; provider ref may be pending.";
      }
      return { stage, attentionReasons, suggestedAction, suggestedHint };
    }
  }

  if (currentSubscription && ["active", "trialing"].includes(currentSubscription.status)) {
    stage = "pilot_verified";
    suggestedAction = "no_action";
    suggestedHint = "Active subscription; pilot verified.";
  }

  if (eventCounts.pending > 0 && !latestCheckout) {
    stage = "webhook_received";
    suggestedAction = "reprocess_pending_events";
    suggestedHint = "Pending events for workspace.";
  }

  return { stage, attentionReasons, suggestedAction, suggestedHint };
}

/**
 * Get end-to-end billing pilot execution status for a workspace.
 * Single aggregated summary for operator verification.
 */
export async function getBillingPilotExecutionStatus(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<BillingPilotExecutionStatus> {
  const pilot = await getBillingPilotDiagnostics(supabase, workspaceId);
  const adapterDiag = getBillingAdapterDiagnostics();
  const latestCheckout = await getLatestBillingCheckoutSessionByWorkspace(supabase, workspaceId);
  const subscription = await getCurrentBillingSubscription(supabase, workspaceId);
  const eventCounts = await getBillingEventCountsByWorkspace(supabase, workspaceId);
  const recentEvents = await getBillingEventsByWorkspace(supabase, workspaceId, { limit: 15 });

  const failedEvents = recentEvents.filter((e) => e.processingStatus === "failed");
  const lastFailureReason = failedEvents[0]?.errorInfo ?? null;
  const latestRelevantEvent = recentEvents[0] ?? null;

  const pilotEligible = pilot.liveCheckoutEligible || pilot.mode === "sandbox";
  const isSandbox = pilot.mode === "sandbox";

  const { stage, attentionReasons, suggestedAction, suggestedHint } =
    resolveBillingPilotExecutionStage({
      inPilotCohort: pilot.inPilotCohort,
      pilotEligible,
      mode: pilot.mode,
      latestCheckout,
      currentSubscription: subscription,
      recentEvents,
      eventCounts,
      lastFailureReason,
    });

  return {
    workspaceId,
    stage,
    mode: pilot.mode,
    pilotEligible,
    latestCheckout: toCheckoutSummary(latestCheckout),
    currentSubscription: toSubscriptionSummary(subscription),
    latestRelevantEvent: latestRelevantEvent ? toEventSummary(latestRelevantEvent) : null,
    eventCounts,
    attentionReasons,
    suggestedOperatorAction: suggestedAction,
    suggestedOperatorHint: suggestedHint,
    lastFailureReason,
    isSandbox,
  };
}

/**
 * Get operator actions available for pilot execution (Step 20).
 */
export function getBillingPilotOperatorActions(
  status: BillingPilotExecutionStatus
): BillingPilotOperatorAction[] {
  const actions: BillingPilotOperatorAction[] = ["inspect_diagnostics", "see_adapter_mode"];

  if (status.workspaceId) {
    actions.push("open_billing_overview");
  }
  if (status.eventCounts.failed > 0) {
    actions.push("reprocess_failed_event");
  }
  if (status.eventCounts.pending > 0) {
    actions.push("reprocess_pending_events");
  }
  if (!status.pilotEligible) {
    actions.push("confirm_pilot_cohort");
  }
  if (
    status.pilotEligible &&
    status.stage === "ready_for_checkout" &&
    status.mode === "provider_live"
  ) {
    actions.push("start_checkout");
  }
  if (
    ["awaiting_provider_completion", "checkout_created"].includes(status.stage) &&
    status.mode === "provider_live"
  ) {
    actions.push("await_webhook");
  }

  return [...new Set(actions)];
}
