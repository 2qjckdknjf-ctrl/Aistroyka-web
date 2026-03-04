import type { SupabaseClient } from "@supabase/supabase-js";

/** Upsert device cursor (idempotent by tenant, user, device). */
export async function upsertCursor(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  deviceId: string,
  cursor: number
): Promise<boolean> {
  const { error } = await supabase.from("sync_cursors").upsert(
    {
      tenant_id: tenantId,
      user_id: userId,
      device_id: deviceId,
      cursor,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,user_id,device_id" }
  );
  return !error;
}

/** Get stored cursor for device (0 if none). */
export async function getCursor(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  deviceId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("sync_cursors")
    .select("cursor")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("device_id", deviceId)
    .maybeSingle();
  if (error || !data) return 0;
  return (data as { cursor: number }).cursor;
}
