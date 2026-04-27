/**
 * Billing event processor service (Step 14).
 * Translates provider events to canonical form, applies reconciliation rules.
 * Idempotent, repeatable. No UI dependency. Ready for cron/job.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanCode } from "@aistroyka/contracts";
import type { BillingProviderAdapter } from "./billing-adapter.types";
import { getBillingAdapter } from "./billing-adapter-registry";
import {
  getBillingEventById,
  getUnprocessedBillingEvents,
  getUnprocessedBillingEventsForWorkspace,
  getBillingCheckoutSession,
  getBillingCheckoutSessionByProviderRef,
  getCurrentBillingSubscription,
  getBillingSubscriptionByProviderRef,
  createBillingSubscription,
  updateBillingCheckoutSessionStatus,
  updateBillingSubscriptionStatus,
  markBillingEventProcessed,
  resetBillingEventToPending,
} from "./billing-readiness.repository";
import type {
  BillingEvent,
  BillingProviderKind,
  BillingCycle,
} from "./billing-readiness.types";
import type {
  BillingTranslatedEvent,
  BillingEventProcessingResult,
  BillingEventProcessorStatus,
  BillingEventReconciliationHint,
} from "./billing-event-processor.types";

const SANDBOX_PROVIDER = "sandbox" as const;
const DEFAULT_BILLING_CYCLE: BillingCycle = "monthly";

// ─── Translation boundary ────────────────────────────────────────────────────

/**
 * Translates raw event record to canonical BillingTranslatedEvent via adapter.
 * Returns null if adapter cannot translate (unsupported type, skipProcessing).
 */
export async function translateBillingEventWithAdapter(
  event: BillingEvent,
  adapter: BillingProviderAdapter
): Promise<BillingTranslatedEvent | null> {
  const translate = adapter.translateProviderEvent;
  if (!translate) return null;

  const result = await translate({
    providerEventRef: event.providerEventRef,
    eventType: event.eventType,
    payload: event.eventPayloadSnapshot,
    workspaceId: event.workspaceId,
  });
  if (!result || result.skipProcessing) return null;

  const payload = event.eventPayloadSnapshot;
  const sessionId = (result.sessionId ?? payload.sessionId) as string | null;
  const planCode = (result.planCode ?? payload.planCode) as PlanCode | undefined;
  const rawCycle = (result.billingCycle ?? payload.billingCycle) as string | undefined;
  const billingCycle: BillingCycle = ["monthly", "annual", "custom"].includes(rawCycle ?? "") ? (rawCycle as BillingCycle) : DEFAULT_BILLING_CYCLE;
  const workspaceId = result.workspaceId ?? event.workspaceId;

  let reconciliationHint: BillingEventReconciliationHint | null = null;

  if (result.checkoutAction === "complete" && sessionId && planCode) {
    reconciliationHint = { action: "checkout_complete", sessionId, planCode, billingCycle };
  } else if (result.checkoutAction === "cancel" && sessionId) {
    reconciliationHint = { action: "checkout_cancel", sessionId };
  } else if (result.subscriptionAction === "activate" && workspaceId && planCode) {
    reconciliationHint = { action: "subscription_activate", workspaceId, planCode, billingCycle };
  } else if (result.subscriptionAction === "cancel" && (workspaceId || result.providerSubscriptionRef)) {
    reconciliationHint = {
      action: "subscription_cancel",
      workspaceId: workspaceId ?? null,
      providerSubscriptionRef: result.providerSubscriptionRef ?? null,
    };
  } else if (result.subscriptionAction === "expire" && (workspaceId || result.providerSubscriptionRef)) {
    reconciliationHint = {
      action: "subscription_cancel",
      workspaceId: workspaceId ?? null,
      providerSubscriptionRef: result.providerSubscriptionRef ?? null,
    };
  }

  if (!reconciliationHint && !result.checkoutAction && !result.subscriptionAction) {
    return null;
  }

  return {
    providerKind: adapter.getProviderKind(),
    providerEventRef: event.providerEventRef,
    eventType: result.canonicalEventType,
    workspaceId,
    checkoutSessionId: sessionId,
    subscriptionId: (payload.subscriptionId as string) ?? null,
    targetPlanCode: planCode ?? null,
    occurredAt: event.receivedAt,
    payload: payload,
    reconciliationHint,
  };
}

// ─── Reconciliation rules ───────────────────────────────────────────────────

async function applyReconciliation(
  supabase: SupabaseClient,
  translated: BillingTranslatedEvent
): Promise<{
  status: BillingEventProcessorStatus;
  updatedSubscriptionId: string | null;
  updatedCheckoutSessionId: string | null;
  notes: string[];
  idempotentHit: boolean;
  error?: string;
}> {
  const notes: string[] = [];
  const hint = translated.reconciliationHint;
  if (!hint) {
    return { status: "skipped", updatedSubscriptionId: null, updatedCheckoutSessionId: null, notes: ["No reconciliation hint"], idempotentHit: false };
  }

  async function resolveCheckoutSession(sessionId: string) {
    const byId = await getBillingCheckoutSession(supabase, sessionId);
    if (byId) return byId;
    return getBillingCheckoutSessionByProviderRef(supabase, sessionId);
  }

  switch (hint.action) {
    case "checkout_complete": {
      const session = await resolveCheckoutSession(hint.sessionId);
      if (!session) {
        return { status: "failed", updatedSubscriptionId: null, updatedCheckoutSessionId: null, notes: ["Session not found"], idempotentHit: false, error: "Session not found" };
      }
      if (session.status === "completed") {
        const existing = await getCurrentBillingSubscription(supabase, session.workspaceId);
        return {
          status: "processed",
          updatedSubscriptionId: existing?.id ?? null,
          updatedCheckoutSessionId: session.id,
          notes: ["Already completed; idempotent"],
          idempotentHit: true,
        };
      }
      if (["cancelled", "expired", "failed"].includes(session.status)) {
        return { status: "failed", updatedSubscriptionId: null, updatedCheckoutSessionId: null, notes: [`Session already ${session.status}`], idempotentHit: false, error: `Session already ${session.status}` };
      }

      const { error: updateErr } = await updateBillingCheckoutSessionStatus(supabase, session.id, "completed");
      if (updateErr) {
        return { status: "failed", updatedSubscriptionId: null, updatedCheckoutSessionId: null, notes: [updateErr], idempotentHit: false, error: updateErr };
      }

      const existing = await getCurrentBillingSubscription(supabase, session.workspaceId);
      if (existing) {
        notes.push("Subscription already exists; no duplicate");
        return { status: "processed", updatedSubscriptionId: existing.id, updatedCheckoutSessionId: session.id, notes, idempotentHit: true };
      }

      const billingProvider = translated.providerKind === "stripe" ? ("stripe" as const) : SANDBOX_PROVIDER;
      const stripeSubId =
        billingProvider === "stripe"
          ? (translated.payload?.data as Record<string, unknown> | undefined)?.object as { subscription?: string } | undefined
          : undefined;
      const providerSubRef =
        billingProvider === "stripe"
          ? (stripeSubId?.subscription ?? `stripe_${hint.sessionId}`)
          : `sandbox_${hint.sessionId}`;
      const { data: sub, error: subErr } = await createBillingSubscription(supabase, {
        workspaceId: session.workspaceId,
        canonicalPlanCode: hint.planCode,
        billingProvider,
        providerSubscriptionRef: providerSubRef,
        status: "active",
        billingCycle: hint.billingCycle,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (subErr) {
        return { status: "failed", updatedSubscriptionId: null, updatedCheckoutSessionId: session.id, notes: [subErr], idempotentHit: false, error: subErr };
      }
      return { status: "processed", updatedSubscriptionId: sub?.id ?? null, updatedCheckoutSessionId: session.id, notes, idempotentHit: false };
    }

    case "checkout_cancel": {
      const session = await resolveCheckoutSession(hint.sessionId);
      if (!session) {
        return { status: "failed", updatedSubscriptionId: null, updatedCheckoutSessionId: null, notes: ["Session not found"], idempotentHit: false, error: "Session not found" };
      }
      if (session.status === "cancelled") {
        return { status: "processed", updatedSubscriptionId: null, updatedCheckoutSessionId: session.id, notes: ["Already cancelled; idempotent"], idempotentHit: true };
      }
      if (["completed", "expired", "failed"].includes(session.status)) {
        return { status: "failed", updatedSubscriptionId: null, updatedCheckoutSessionId: null, notes: [`Session already ${session.status}`], idempotentHit: false, error: `Session already ${session.status}` };
      }

      const { error: updateErr } = await updateBillingCheckoutSessionStatus(supabase, session.id, "cancelled");
      if (updateErr) {
        return { status: "failed", updatedSubscriptionId: null, updatedCheckoutSessionId: null, notes: [updateErr], idempotentHit: false, error: updateErr };
      }
      return { status: "processed", updatedSubscriptionId: null, updatedCheckoutSessionId: session.id, notes, idempotentHit: false };
    }

    case "subscription_activate": {
      const sub = await getCurrentBillingSubscription(supabase, hint.workspaceId);
      if (!sub) {
        const { data: created, error: createErr } = await createBillingSubscription(supabase, {
          workspaceId: hint.workspaceId,
          canonicalPlanCode: hint.planCode,
          billingProvider: SANDBOX_PROVIDER,
          providerSubscriptionRef: null,
          status: "active",
          billingCycle: hint.billingCycle,
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
        if (createErr) {
          return { status: "failed", updatedSubscriptionId: null, updatedCheckoutSessionId: null, notes: [createErr], idempotentHit: false, error: createErr };
        }
        return { status: "processed", updatedSubscriptionId: created?.id ?? null, updatedCheckoutSessionId: null, notes, idempotentHit: false };
      }
      if (sub.status === "active") {
        return { status: "processed", updatedSubscriptionId: sub.id, updatedCheckoutSessionId: null, notes: ["Already active; idempotent"], idempotentHit: true };
      }
      const { data: updated, error: updateErr } = await updateBillingSubscriptionStatus(supabase, sub.id, "active");
      if (updateErr) {
        return { status: "failed", updatedSubscriptionId: null, updatedCheckoutSessionId: null, notes: [updateErr], idempotentHit: false, error: updateErr };
      }
      return { status: "processed", updatedSubscriptionId: updated?.id ?? sub.id, updatedCheckoutSessionId: null, notes, idempotentHit: false };
    }

    case "subscription_cancel": {
      let workspaceId = hint.workspaceId;
      if (!workspaceId && hint.providerSubscriptionRef) {
        const subByRef = await getBillingSubscriptionByProviderRef(supabase, hint.providerSubscriptionRef);
        workspaceId = subByRef?.workspaceId ?? null;
      }
      if (!workspaceId) {
        return { status: "skipped", updatedSubscriptionId: null, updatedCheckoutSessionId: null, notes: ["No workspace for subscription_cancel"], idempotentHit: false };
      }
      const sub = await getCurrentBillingSubscription(supabase, workspaceId);
      if (!sub) {
        return { status: "processed", updatedSubscriptionId: null, updatedCheckoutSessionId: null, notes: ["No subscription to cancel"], idempotentHit: true };
      }
      if (["cancelled", "expired"].includes(sub.status)) {
        return { status: "processed", updatedSubscriptionId: sub.id, updatedCheckoutSessionId: null, notes: ["Already cancelled; idempotent"], idempotentHit: true };
      }
      const { data: updated, error: updateErr } = await updateBillingSubscriptionStatus(supabase, sub.id, "cancelled", { endedAt: new Date().toISOString() });
      if (updateErr) {
        return { status: "failed", updatedSubscriptionId: null, updatedCheckoutSessionId: null, notes: [updateErr], idempotentHit: false, error: updateErr };
      }
      return { status: "processed", updatedSubscriptionId: updated?.id ?? sub.id, updatedCheckoutSessionId: null, notes, idempotentHit: false };
    }

    case "subscription_pause": {
      const sub = await getCurrentBillingSubscription(supabase, hint.workspaceId);
      if (!sub) {
        return { status: "skipped", updatedSubscriptionId: null, updatedCheckoutSessionId: null, notes: ["No subscription to pause"], idempotentHit: false };
      }
      if (sub.status === "paused") {
        return { status: "processed", updatedSubscriptionId: sub.id, updatedCheckoutSessionId: null, notes: ["Already paused; idempotent"], idempotentHit: true };
      }
      const { data: updated, error: updateErr } = await updateBillingSubscriptionStatus(supabase, sub.id, "paused");
      if (updateErr) {
        return { status: "failed", updatedSubscriptionId: null, updatedCheckoutSessionId: null, notes: [updateErr], idempotentHit: false, error: updateErr };
      }
      return { status: "processed", updatedSubscriptionId: updated?.id ?? sub.id, updatedCheckoutSessionId: null, notes, idempotentHit: false };
    }

    default: {
      const _exhaustive: never = hint;
      return { status: "skipped", updatedSubscriptionId: null, updatedCheckoutSessionId: null, notes: ["Unknown hint"], idempotentHit: false };
    }
  }
}

// ─── Processor entrypoints ───────────────────────────────────────────────────

/**
 * Process a single billing event record by id.
 * Idempotent: already-processed events return noop.
 */
export async function processBillingEventRecord(
  supabase: SupabaseClient,
  eventId: string,
  adapter?: BillingProviderAdapter
): Promise<BillingEventProcessingResult> {
  const event = await getBillingEventById(supabase, eventId);
  if (!event) {
    return { status: "failed", eventId, updatedSubscriptionId: null, updatedCheckoutSessionId: null, notes: ["Event not found"], idempotentHit: false, error: "Event not found" };
  }

  if (event.processingStatus !== "pending") {
    return {
      status: "noop",
      eventId,
      updatedSubscriptionId: null,
      updatedCheckoutSessionId: null,
      notes: [`Already ${event.processingStatus}`],
      idempotentHit: true,
    };
  }

  const resolvedAdapter = adapter ?? getBillingAdapter(event.billingProvider as BillingProviderKind);
  const translated = await translateBillingEventWithAdapter(event, resolvedAdapter);

  if (!translated) {
    await markBillingEventProcessed(supabase, eventId, "skipped", "Unsupported event type or skipProcessing");
    return { status: "skipped", eventId, updatedSubscriptionId: null, updatedCheckoutSessionId: null, notes: ["Unsupported or skipProcessing"], idempotentHit: false };
  }

  const outcome = await applyReconciliation(supabase, translated);

  const dbStatus: "processed" | "failed" | "skipped" = outcome.status === "processed" || outcome.status === "noop" ? "processed" : outcome.status === "failed" ? "failed" : "skipped";
  await markBillingEventProcessed(supabase, eventId, dbStatus, outcome.error ?? undefined);

  return {
    status: outcome.status === "noop" ? "noop" : outcome.status,
    eventId,
    updatedSubscriptionId: outcome.updatedSubscriptionId,
    updatedCheckoutSessionId: outcome.updatedCheckoutSessionId,
    notes: outcome.notes,
    idempotentHit: outcome.idempotentHit,
    error: outcome.error,
  };
}

/**
 * Process translated event directly (for testing or when translation is done elsewhere).
 */
export async function processTranslatedBillingEvent(
  supabase: SupabaseClient,
  event: BillingEvent,
  translated: BillingTranslatedEvent
): Promise<BillingEventProcessingResult> {
  if (event.processingStatus !== "pending") {
    return {
      status: "noop",
      eventId: event.id,
      updatedSubscriptionId: null,
      updatedCheckoutSessionId: null,
      notes: [`Already ${event.processingStatus}`],
      idempotentHit: true,
    };
  }

  const outcome = await applyReconciliation(supabase, translated);

  const dbStatus: "processed" | "failed" | "skipped" = outcome.status === "processed" || outcome.status === "noop" ? "processed" : outcome.status === "failed" ? "failed" : "skipped";
  await markBillingEventProcessed(supabase, event.id, dbStatus, outcome.error ?? undefined);

  return {
    status: outcome.status === "noop" ? "noop" : outcome.status,
    eventId: event.id,
    updatedSubscriptionId: outcome.updatedSubscriptionId,
    updatedCheckoutSessionId: outcome.updatedCheckoutSessionId,
    notes: outcome.notes,
    idempotentHit: outcome.idempotentHit,
    error: outcome.error,
  };
}

/**
 * Process all pending billing events.
 */
export async function processPendingBillingEvents(
  supabase: SupabaseClient,
  limit = 50
): Promise<BillingEventProcessingResult[]> {
  const events = await getUnprocessedBillingEvents(supabase, limit);
  const results: BillingEventProcessingResult[] = [];
  for (const ev of events) {
    const r = await processBillingEventRecord(supabase, ev.id);
    results.push(r);
  }
  return results;
}

/**
 * Reprocess a single billing event by id (Step 19).
 * Idempotent: already-processed returns noop. For failed events, resets to pending then processes.
 */
export async function reprocessBillingEvent(
  supabase: SupabaseClient,
  eventId: string
): Promise<BillingEventProcessingResult> {
  const event = await getBillingEventById(supabase, eventId);
  if (!event) {
    return { status: "failed", eventId, updatedSubscriptionId: null, updatedCheckoutSessionId: null, notes: ["Event not found"], idempotentHit: false, error: "Event not found" };
  }
  if (event.processingStatus === "pending") {
    return processBillingEventRecord(supabase, eventId);
  }
  if (event.processingStatus === "processed" || event.processingStatus === "skipped") {
    return {
      status: "noop",
      eventId,
      updatedSubscriptionId: null,
      updatedCheckoutSessionId: null,
      notes: [`Already ${event.processingStatus}`],
      idempotentHit: true,
    };
  }
  if (event.processingStatus === "failed") {
    const { error: resetErr } = await resetBillingEventToPending(supabase, eventId);
    if (resetErr) {
      return { status: "failed", eventId, updatedSubscriptionId: null, updatedCheckoutSessionId: null, notes: [resetErr], idempotentHit: false, error: resetErr };
    }
    return processBillingEventRecord(supabase, eventId);
  }
  return {
    status: "noop",
    eventId,
    updatedSubscriptionId: null,
    updatedCheckoutSessionId: null,
    notes: [`Unknown status: ${event.processingStatus}`],
    idempotentHit: true,
  };
}

/**
 * Reprocess pending/failed events for a workspace (Step 19).
 */
export async function processPendingBillingEventsForWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  opts?: { includeFailed?: boolean; limit?: number }
): Promise<BillingEventProcessingResult[]> {
  const includeFailed = opts?.includeFailed ?? true;
  const limit = Math.min(opts?.limit ?? 50, 100);
  const events = await getUnprocessedBillingEventsForWorkspace(supabase, workspaceId, includeFailed, limit);
  const results: BillingEventProcessingResult[] = [];
  for (const ev of events) {
    if (ev.processingStatus === "failed") {
      const { error: resetErr } = await resetBillingEventToPending(supabase, ev.id);
      if (!resetErr) {
        const r = await processBillingEventRecord(supabase, ev.id);
        results.push(r);
      } else {
        results.push({
          status: "failed",
          eventId: ev.id,
          updatedSubscriptionId: null,
          updatedCheckoutSessionId: null,
          notes: [resetErr],
          idempotentHit: false,
          error: resetErr,
        });
      }
    } else {
      const r = await processBillingEventRecord(supabase, ev.id);
      results.push(r);
    }
  }
  return results;
}
