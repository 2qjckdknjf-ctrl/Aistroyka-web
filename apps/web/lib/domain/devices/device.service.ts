import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import * as repo from "./device.repository";
import type { DeviceToken } from "./device.repository";

export async function registerDevice(
  supabase: SupabaseClient,
  ctx: TenantContext,
  deviceId: string,
  platform: "ios" | "android",
  token: string
): Promise<{ success: boolean; error?: string }> {
  if (!ctx.tenantId || !ctx.userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (!deviceId || !platform || !token) {
    return { success: false, error: "device_id, platform (ios|android), and token required" };
  }

  const device: DeviceToken = {
    tenant_id: ctx.tenantId,
    user_id: ctx.userId,
    device_id: deviceId,
    platform,
    token,
  };

  const { error } = await repo.upsertDeviceToken(supabase, device);
  if (error) {
    return { success: false, error };
  }

  return { success: true };
}

export async function listDevices(
  supabase: SupabaseClient,
  ctx: TenantContext,
  userId?: string
): Promise<{ data: DeviceToken[]; error: string | null }> {
  if (!ctx.tenantId) {
    return { data: [], error: "Unauthorized" };
  }

  const data = await repo.listDeviceTokens(supabase, ctx.tenantId, userId ?? ctx.userId ?? undefined);
  return { data, error: null };
}

export async function unregisterDevice(
  supabase: SupabaseClient,
  ctx: TenantContext,
  deviceId: string
): Promise<{ success: boolean; error?: string }> {
  if (!ctx.tenantId || !ctx.userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (!deviceId) {
    return { success: false, error: "device_id required" };
  }

  const { error } = await repo.deleteDeviceToken(supabase, ctx.tenantId, ctx.userId, deviceId);
  if (error) {
    return { success: false, error };
  }

  return { success: true };
}

export async function updateDeviceLastSeen(
  supabase: SupabaseClient,
  ctx: TenantContext,
  deviceId: string
): Promise<void> {
  if (!ctx.tenantId || !ctx.userId) {
    return;
  }

  await repo.updateDeviceLastSeen(supabase, ctx.tenantId, ctx.userId, deviceId);
}
