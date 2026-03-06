/**
 * Append-only ops events for metrics (sync_conflict, etc.). Tenant-scoped, RLS-safe.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type OpsEventType = "sync_conflict";

/** Record a sync conflict (best-effort; does not throw). */
export async function recordSyncConflict(
  supabase: SupabaseClient,
  tenantId: string,
  payload: { hint: string; device_id: string }
): Promise<void> {
  await Promise.resolve(
    supabase
      .from("ops_events")
      .insert({
        tenant_id: tenantId,
        type: "sync_conflict",
        metadata: { hint: payload.hint, device_id: payload.device_id },
      })
  ).catch(() => {});
}
