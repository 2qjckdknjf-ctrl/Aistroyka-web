/**
 * Emit change_log entries for sync engine. Call after domain writes.
 * Payload must be minimal and safe (no secrets).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { emitChange } from "./change-log.repository";
import type { ChangeResourceType, ChangeType } from "./change-log.types";

export interface EmitParams {
  tenant_id: string;
  resource_type: ChangeResourceType;
  resource_id: string;
  change_type: ChangeType;
  changed_by?: string | null;
  payload?: Record<string, unknown>;
}

/** Best-effort emit; does not throw. Returns new cursor or null. */
export async function emitChangeLog(supabase: SupabaseClient, params: EmitParams): Promise<number | null> {
  try {
    const safePayload = params.payload && typeof params.payload === "object"
      ? { ...params.payload }
      : {};
    return await emitChange(supabase, {
      ...params,
      payload: safePayload,
    });
  } catch {
    return null;
  }
}
