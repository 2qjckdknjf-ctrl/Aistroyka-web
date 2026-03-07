import type { SupabaseClient } from "@supabase/supabase-js";

export interface DeviceToken {
  tenant_id: string;
  user_id: string;
  device_id: string;
  platform: "ios" | "android";
  token: string;
  last_seen?: string;
  created_at?: string;
  updated_at?: string;
}

export async function upsertDeviceToken(
  supabase: SupabaseClient,
  device: DeviceToken
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("device_tokens")
    .upsert(
      {
        tenant_id: device.tenant_id,
        user_id: device.user_id,
        device_id: device.device_id,
        platform: device.platform,
        token: device.token,
      },
      {
        onConflict: "tenant_id,user_id,device_id",
      }
    );
  return { error: error?.message ?? null };
}

export async function listDeviceTokens(
  supabase: SupabaseClient,
  tenantId: string,
  userId?: string
): Promise<DeviceToken[]> {
  let query = supabase
    .from("device_tokens")
    .select("*")
    .eq("tenant_id", tenantId);
  
  if (userId) {
    query = query.eq("user_id", userId);
  }
  
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as DeviceToken[];
}

export async function deleteDeviceToken(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  deviceId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("device_tokens")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("device_id", deviceId);
  return { error: error?.message ?? null };
}

export async function updateDeviceLastSeen(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  deviceId: string
): Promise<void> {
  await supabase
    .from("device_tokens")
    .update({ last_seen: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("device_id", deviceId)
    .then(() => {
      // Ignore errors - this is best-effort
    });
}
