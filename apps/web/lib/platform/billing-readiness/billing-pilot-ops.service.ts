/**
 * Billing pilot ops service (Step 19).
 * Internal admin tooling: diagnostics, cohort management, reprocess.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getWorkspaceSelectedPlanState } from "@/lib/platform/plan-fit/persistence/workspace-plan-state.repository";
import { getBillingAdapterDiagnostics } from "./billing-adapter-registry";
import { getBillingPilotDiagnostics } from "./billing-pilot-resolution.service";
import {
  getLatestBillingCheckoutSessionByWorkspace,
  getCurrentBillingSubscription,
  getBillingEventsByWorkspace,
  getBillingEventCountsByWorkspace,
} from "./billing-readiness.repository";
import {
  listBillingPilotWorkspaces,
  upsertBillingPilotWorkspace,
  removeBillingPilotWorkspace,
  getBillingPilotWorkspaceByWorkspaceId,
} from "./billing-pilot-cohort.repository";
import {
  reprocessBillingEvent,
  processPendingBillingEventsForWorkspace,
} from "./billing-event-processor.service";
import type {
  BillingPilotWorkspaceSummary,
  BillingPilotWorkspaceDiagnostics,
  BillingPilotCheckoutSummary,
  BillingPilotSubscriptionSummary,
  BillingPilotEventSummary,
  BillingPilotEventCounts,
} from "./billing-pilot-ops.types";

function toCheckoutSummary(session: Awaited<ReturnType<typeof getLatestBillingCheckoutSessionByWorkspace>>): BillingPilotCheckoutSummary | null {
  if (!session) return null;
  return {
    id: session.id,
    status: session.status,
    targetPlanCode: session.targetPlanCode,
    providerSessionRef: session.providerSessionRef,
    createdAt: session.createdAt,
  };
}

function toSubscriptionSummary(sub: Awaited<ReturnType<typeof getCurrentBillingSubscription>>): BillingPilotSubscriptionSummary | null {
  if (!sub) return null;
  return {
    id: sub.id,
    status: sub.status,
    canonicalPlanCode: sub.canonicalPlanCode,
    billingProvider: sub.billingProvider,
    providerSubscriptionRef: sub.providerSubscriptionRef,
  };
}

/**
 * Get full workspace billing pilot diagnostics (Step 19).
 */
export async function getBillingPilotWorkspaceDiagnostics(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<BillingPilotWorkspaceDiagnostics | null> {
  const pilot = await getBillingPilotDiagnostics(supabase, workspaceId);
  const adapterDiag = getBillingAdapterDiagnostics();
  const selected = await getWorkspaceSelectedPlanState(supabase, workspaceId);
  const latestCheckout = await getLatestBillingCheckoutSessionByWorkspace(supabase, workspaceId);
  const subscription = await getCurrentBillingSubscription(supabase, workspaceId);
  const eventCounts = await getBillingEventCountsByWorkspace(supabase, workspaceId);
  const recentEvents = await getBillingEventsByWorkspace(supabase, workspaceId, { limit: 10 });

  const failedEvents = recentEvents.filter((e) => e.processingStatus === "failed");
  const lastFailureReason = failedEvents[0]?.errorInfo ?? null;

  return {
    workspaceId,
    inPilotCohort: pilot.inPilotCohort,
    liveCheckoutEligible: pilot.liveCheckoutEligible,
    webhookProcessingEligible: pilot.webhookProcessingEligible,
    mode: pilot.mode,
    reason: pilot.reason,
    activeAdapterKind: adapterDiag.activeAdapterKind,
    checkoutMode: adapterDiag.checkoutMode,
    selectedPlanCode: selected?.canonicalPlanCode ?? null,
    latestCheckout: toCheckoutSummary(latestCheckout),
    currentSubscription: toSubscriptionSummary(subscription),
    eventCounts,
    lastFailureReason,
    recentEvents: recentEvents.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      processingStatus: e.processingStatus,
      receivedAt: e.receivedAt,
      errorInfo: e.errorInfo,
    })),
  };
}

/**
 * List pilot workspaces (DB + env hybrid summary).
 */
export async function listBillingPilotWorkspacesSummary(
  supabase: SupabaseClient,
  opts?: { limit?: number; offset?: number }
): Promise<BillingPilotWorkspaceSummary[]> {
  const dbRecords = await listBillingPilotWorkspaces(supabase, opts);
  const summaries: BillingPilotWorkspaceSummary[] = dbRecords.map((r) => ({
    workspaceId: r.workspaceId,
    inPilotCohort: true,
    liveCheckoutEnabled: r.liveCheckoutEnabled,
    webhookProcessingEnabled: r.webhookProcessingEnabled,
    cohortLabel: r.cohortLabel,
    source: "db" as const,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  const envIds = getEnvAllowlist();
  const dbIds = new Set(summaries.map((s) => s.workspaceId));
  for (const wid of envIds) {
    if (!dbIds.has(wid)) {
      summaries.push({
        workspaceId: wid,
        inPilotCohort: true,
        liveCheckoutEnabled: true,
        webhookProcessingEnabled: true,
        cohortLabel: null,
        source: "env",
        createdAt: null,
        updatedAt: null,
      });
      dbIds.add(wid);
    }
  }

  return summaries;
}

function getEnvAllowlist(): Set<string> {
  if (typeof process === "undefined" || !process.env) return new Set();
  const v = process.env.BILLING_PILOT_WORKSPACE_IDS?.trim();
  if (!v) return new Set();
  return new Set(v.split(",").map((id) => id.trim()).filter(Boolean));
}

/**
 * Add workspace to pilot cohort (DB).
 */
export async function addWorkspaceToPilotCohort(
  supabase: SupabaseClient,
  input: {
    workspaceId: string;
    liveCheckoutEnabled?: boolean;
    webhookProcessingEnabled?: boolean;
    cohortLabel?: string | null;
    notes?: string | null;
    enabledBy?: string | null;
  }
): Promise<{ data: BillingPilotWorkspaceSummary | null; error: string | null }> {
  const { data, error } = await upsertBillingPilotWorkspace(supabase, {
    workspaceId: input.workspaceId,
    liveCheckoutEnabled: input.liveCheckoutEnabled ?? true,
    webhookProcessingEnabled: input.webhookProcessingEnabled ?? true,
    cohortLabel: input.cohortLabel ?? null,
    notes: input.notes ?? null,
    enabledBy: input.enabledBy ?? null,
  });
  if (error) return { data: null, error };
  if (!data) return { data: null, error: "Upsert returned no data" };
  return {
    data: {
      workspaceId: data.workspaceId,
      inPilotCohort: true,
      liveCheckoutEnabled: data.liveCheckoutEnabled,
      webhookProcessingEnabled: data.webhookProcessingEnabled,
      cohortLabel: data.cohortLabel,
      source: "db",
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    },
    error: null,
  };
}

/**
 * Remove workspace from pilot cohort (DB only; env unchanged).
 */
export async function removeWorkspaceFromPilotCohort(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<{ error: string | null }> {
  const existing = await getBillingPilotWorkspaceByWorkspaceId(supabase, workspaceId);
  if (!existing) {
    return { error: "Workspace not in DB pilot cohort (may be env-only; remove from BILLING_PILOT_WORKSPACE_IDS)" };
  }
  return removeBillingPilotWorkspace(supabase, workspaceId);
}

/**
 * Update pilot workspace settings.
 */
export async function updateBillingPilotWorkspace(
  supabase: SupabaseClient,
  input: {
    workspaceId: string;
    liveCheckoutEnabled?: boolean;
    webhookProcessingEnabled?: boolean;
    cohortLabel?: string | null;
    notes?: string | null;
  }
): Promise<{ data: BillingPilotWorkspaceSummary | null; error: string | null }> {
  return addWorkspaceToPilotCohort(supabase, input);
}

/**
 * Reprocess single event.
 */
export async function reprocessBillingEventOps(
  supabase: SupabaseClient,
  eventId: string
) {
  return reprocessBillingEvent(supabase, eventId);
}

/**
 * Reprocess pending/failed events for workspace.
 */
export async function reprocessBillingEventsForWorkspaceOps(
  supabase: SupabaseClient,
  workspaceId: string,
  opts?: { includeFailed?: boolean; limit?: number }
) {
  return processPendingBillingEventsForWorkspace(supabase, workspaceId, opts);
}
