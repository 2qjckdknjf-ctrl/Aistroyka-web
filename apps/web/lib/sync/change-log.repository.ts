import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChangeResourceType, ChangeType } from "./change-log.types";

export interface EmitChangeParams {
  tenant_id: string;
  resource_type: ChangeResourceType;
  resource_id: string;
  change_type: ChangeType;
  changed_by?: string | null;
  payload?: Record<string, unknown>;
}

/** Emit one change_log row. Returns new cursor (id) or null on error. */
export async function emitChange(
  supabase: SupabaseClient,
  params: EmitChangeParams
): Promise<number | null> {
  const { data, error } = await supabase
    .from("change_log")
    .insert({
      tenant_id: params.tenant_id,
      resource_type: params.resource_type,
      resource_id: params.resource_id,
      change_type: params.change_type,
      changed_by: params.changed_by ?? null,
      payload: params.payload ?? {},
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return (data as { id: number }).id;
}

export type ChangeLogRow = {
  id: number;
  tenant_id: string;
  resource_type: string;
  resource_id: string;
  change_type: string;
  changed_by: string | null;
  ts: string;
  payload: Record<string, unknown>;
};

/** Get changes after cursor for tenant (array form for sync/changes route). */
export async function getChangesAfter(
  supabase: SupabaseClient,
  tenantId: string,
  afterCursor: number,
  limit: number
): Promise<ChangeLogRow[]> {
  const { data, error } = await supabase
    .from("change_log")
    .select("id, tenant_id, resource_type, resource_id, change_type, changed_by, ts, payload")
    .eq("tenant_id", tenantId)
    .gt("id", afterCursor)
    .order("id", { ascending: true })
    .limit(limit);
  if (error || !data) return [];
  return data as ChangeLogRow[];
}

/** Get changes after cursor for tenant (rows + nextCursor). */
export async function getChanges(
  supabase: SupabaseClient,
  tenantId: string,
  afterCursor: number,
  limit: number
): Promise<{ rows: ChangeLogRow[]; nextCursor: number }> {
  const rows = await getChangesAfter(supabase, tenantId, afterCursor, limit);
  const nextCursor = rows.length > 0 ? rows[rows.length - 1].id : afterCursor;
  return { rows, nextCursor };
}

/** Get current max cursor for tenant (latest change_log id). */
export async function getMaxCursor(supabase: SupabaseClient, tenantId: string): Promise<number> {
  const { data, error } = await supabase
    .from("change_log")
    .select("id")
    .eq("tenant_id", tenantId)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return 0;
  return (data as { id: number }).id;
}

/**
 * Earliest cursor retained for sync (env SYNC_MIN_RETAINED_CURSOR).
 * Client cursor below this => 409 retention_window_exceeded. 0 = disabled.
 */
export function getMinRetainedCursor(): number {
  const v = process.env.SYNC_MIN_RETAINED_CURSOR?.trim();
  if (!v) return 0;
  const n = parseInt(v, 10);
  return Number.isNaN(n) || n < 0 ? 0 : n;
}
