import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canManageWorkerDay } from "./worker-day.policy";
import * as repo from "./worker-day.repository";
import type { WorkerDay, WorkerDayStartEvidence } from "./worker-day.types";

export async function startDay(
  supabase: SupabaseClient,
  ctx: TenantContext,
  evidence?: WorkerDayStartEvidence
): Promise<{ data: WorkerDay | null; error: string }> {
  if (!canManageWorkerDay(ctx)) return { data: null, error: "Insufficient rights" };

  const projectId = evidence?.project_id?.trim() || null;
  if (projectId) {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("tenant_id", ctx.tenantId)
      .maybeSingle();
    if (projectError || !project) return { data: null, error: "Invalid project" };
  }

  const dayDate = new Date().toISOString().slice(0, 10);
  const normalizedEvidence = evidence
    ? { ...evidence, ...(projectId ? { project_id: projectId } : {}) }
    : undefined;
  const data = await repo.setStarted(supabase, ctx.tenantId, ctx.userId, dayDate, normalizedEvidence);
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
