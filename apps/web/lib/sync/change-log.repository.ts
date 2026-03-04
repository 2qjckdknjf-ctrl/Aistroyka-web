import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChangeLogEmitParams, ChangeLogEntry } from "./change-log.types";

/** Emit one change_log row. Uses bigserial id as cursor. Best-effort; does not throw. */
export async function emitChange(supabase: SupabaseClient, params: ChangeLogEmitParams): Promise<void> {
  try {
    await supabase.from("change_log").insert({
      tenant_id: params.tenant_id,
      resource_type: params.resource_type,
      resource_id: params.resource_id,
      change_type: params.change_type,
      changed_by: params.changed_by ?? null,
      payload: params.payload ?? {},
    });
  } catch {
    // best-effort
  }
}

/** Fetch changes after cursor for tenant, ordered by id, limit. */
export async function getChangesAfter(
  supabase: SupabaseClient,
  tenantId: string,
  cursor: number,
  limit: number
): Promise<ChangeLogEntry[]> {
  const { data, error } = await supabase
    .from("change_log")
    .select("id, tenant_id, resource_type, resource_id, change_type, changed_by, ts, payload")
    .eq("tenant_id", tenantId)
    .gt("id", cursor)
    .order("id", { ascending: true })
    .limit(Math.min(limit, 500));
  if (error) return [];
  return (data ?? []) as ChangeLogEntry[];
}

/** Get current max cursor (id) for tenant. */
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
