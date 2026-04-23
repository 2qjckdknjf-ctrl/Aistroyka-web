/**
 * Billing pilot cohort DB repository (Step 19).
 * Manages billing_pilot_workspaces table.
 * Used by pilot.repository for hybrid (DB + env) resolution.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

interface PilotWorkspaceRow {
  workspace_id: string;
  live_checkout_enabled: boolean;
  webhook_processing_enabled: boolean;
  cohort_label: string | null;
  notes: string | null;
  enabled_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingPilotWorkspaceRecord {
  workspaceId: string;
  liveCheckoutEnabled: boolean;
  webhookProcessingEnabled: boolean;
  cohortLabel: string | null;
  notes: string | null;
  enabledBy: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToRecord(r: PilotWorkspaceRow): BillingPilotWorkspaceRecord {
  return {
    workspaceId: r.workspace_id,
    liveCheckoutEnabled: r.live_checkout_enabled,
    webhookProcessingEnabled: r.webhook_processing_enabled,
    cohortLabel: r.cohort_label,
    notes: r.notes,
    enabledBy: r.enabled_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function getBillingPilotWorkspaceByWorkspaceId(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<BillingPilotWorkspaceRecord | null> {
  const { data, error } = await supabase
    .from("billing_pilot_workspaces")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToRecord(data as PilotWorkspaceRow);
}

export async function listBillingPilotWorkspaces(
  supabase: SupabaseClient,
  opts?: { limit?: number; offset?: number }
): Promise<BillingPilotWorkspaceRecord[]> {
  const limit = Math.min(opts?.limit ?? 100, 200);
  const offset = opts?.offset ?? 0;
  const { data, error } = await supabase
    .from("billing_pilot_workspaces")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error || !data) return [];
  return (data as PilotWorkspaceRow[]).map(rowToRecord);
}

export async function upsertBillingPilotWorkspace(
  supabase: SupabaseClient,
  input: {
    workspaceId: string;
    liveCheckoutEnabled?: boolean;
    webhookProcessingEnabled?: boolean;
    cohortLabel?: string | null;
    notes?: string | null;
    enabledBy?: string | null;
  }
): Promise<{ data: BillingPilotWorkspaceRecord | null; error: string | null }> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("billing_pilot_workspaces")
    .upsert(
      {
        workspace_id: input.workspaceId,
        live_checkout_enabled: input.liveCheckoutEnabled ?? true,
        webhook_processing_enabled: input.webhookProcessingEnabled ?? true,
        cohort_label: input.cohortLabel ?? null,
        notes: input.notes ?? null,
        enabled_by: input.enabledBy ?? null,
        updated_at: now,
      },
      { onConflict: "workspace_id" }
    )
    .select("*")
    .single();
  if (error) return { data: null, error: error.message };
  return { data: rowToRecord(data as PilotWorkspaceRow), error: null };
}

export async function removeBillingPilotWorkspace(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("billing_pilot_workspaces")
    .delete()
    .eq("workspace_id", workspaceId);
  return { error: error?.message ?? null };
}
