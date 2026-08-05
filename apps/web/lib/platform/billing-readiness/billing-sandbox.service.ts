/**
 * Sandbox billing flow service (Step 13, Step 14).
 * Internal simulation: complete/cancel checkout via event processor path.
 * No real provider. Admin/owner only.
 *
 * Flow: record event -> process via billing-event-processor.
 * Same processor path as future provider adapter.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getBillingCheckoutSession,
  getCurrentBillingSubscription,
  createBillingEventRecord,
} from "./billing-readiness.repository";
import { processBillingEventRecord } from "./billing-event-processor.service";

const SANDBOX_PROVIDER = "sandbox" as const;

/**
 * Complete sandbox checkout. Records event, then processes via processor.
 * Idempotent when session is completed *and* a subscription exists.
 * If session was marked completed without a subscription (partial failure), re-process to recover.
 */
export async function completeSandboxCheckout(
  supabase: SupabaseClient,
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getBillingCheckoutSession(supabase, sessionId);
  if (!session) return { success: false, error: "Session not found" };
  if (session.status === "completed") {
    const existing = await getCurrentBillingSubscription(supabase, session.workspaceId);
    if (existing) return { success: true };
    // Fall through: recover missing subscription via processor.
  } else if (["cancelled", "expired", "failed"].includes(session.status)) {
    return { success: false, error: `Session already ${session.status}` };
  }

  const eventRef = `sandbox_checkout_${sessionId}_${Date.now()}`;
  const { data: eventData, error: eventErr } = await createBillingEventRecord(supabase, {
    workspaceId: session.workspaceId,
    billingProvider: SANDBOX_PROVIDER,
    providerEventRef: eventRef,
    eventType: "sandbox.checkout.completed",
    eventPayloadSnapshot: {
      sessionId,
      workspaceId: session.workspaceId,
      planCode: session.targetPlanCode,
      billingCycle: session.requestedBillingCycle,
    },
  });
  if (eventErr || !eventData) return { success: false, error: "Failed to record event" };

  const result = await processBillingEventRecord(supabase, eventData.id);
  if (result.status === "failed") {
    return { success: false, error: result.error ?? result.notes.join("; ") };
  }
  return { success: true };
}

/**
 * Cancel sandbox checkout. Records event, then processes via processor.
 * Idempotent: if session already cancelled, event processing returns noop.
 */
export async function cancelSandboxCheckout(
  supabase: SupabaseClient,
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getBillingCheckoutSession(supabase, sessionId);
  if (!session) return { success: false, error: "Session not found" };
  if (session.status === "cancelled") return { success: true };
  if (["completed", "expired", "failed"].includes(session.status)) {
    return { success: false, error: `Session already ${session.status}` };
  }

  const eventRef = `sandbox_checkout_cancel_${sessionId}_${Date.now()}`;
  const { data: eventData, error: eventErr } = await createBillingEventRecord(supabase, {
    workspaceId: session.workspaceId,
    billingProvider: SANDBOX_PROVIDER,
    providerEventRef: eventRef,
    eventType: "sandbox.checkout.cancelled",
    eventPayloadSnapshot: { sessionId, workspaceId: session.workspaceId },
  });
  if (eventErr || !eventData) return { success: false, error: "Failed to record event" };

  const result = await processBillingEventRecord(supabase, eventData.id);
  if (result.status === "failed") {
    return { success: false, error: result.error ?? result.notes.join("; ") };
  }
  return { success: true };
}
