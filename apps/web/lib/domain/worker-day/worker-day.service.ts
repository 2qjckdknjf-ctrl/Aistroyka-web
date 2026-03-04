import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canManageWorkerDay } from "./worker-day.policy";
import * as repo from "./worker-day.repository";
import type { WorkerDay } from "./worker-day.types";

export async function startDay(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<{ data: WorkerDay | null; error: string }> {
  if (!canManageWorkerDay(ctx)) return { data: null, error: "Insufficient rights" };
  const dayDate = new Date().toISOString().slice(0, 10);
  const data = await repo.setStarted(supabase, ctx.tenantId, ctx.userId, dayDate);
  if (!data) return { data: null, error: "Failed to start day" };
  return { data, error: "" };
}

export async function endDay(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<{ data: WorkerDay | null; error: string }> {
  if (!canManageWorkerDay(ctx)) return { data: null, error: "Insufficient rights" };
  const dayDate = new Date().toISOString().slice(0, 10);
  const data = await repo.setEnded(supabase, ctx.tenantId, ctx.userId, dayDate);
  if (!data) return { data: null, error: "Failed to end day" };
  return { data, error: "" };
}
