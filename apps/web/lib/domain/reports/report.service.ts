import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canCreateReport } from "./report.policy";
import * as repo from "./report.repository";
import type { Report } from "./report.types";

export async function createReport(
  supabase: SupabaseClient,
  ctx: TenantContext,
  options?: { dayId?: string | null }
): Promise<{ data: Report | null; error: string }> {
  if (!canCreateReport(ctx)) return { data: null, error: "Insufficient rights" };
  const data = await repo.create(supabase, ctx.tenantId, ctx.userId, options?.dayId);
  if (!data) return { data: null, error: "Failed to create report" };
  return { data, error: "" };
}

export async function addMediaToReport(
  supabase: SupabaseClient,
  ctx: TenantContext,
  reportId: string,
  opts: { mediaId?: string; uploadSessionId?: string }
): Promise<{ ok: boolean; error: string }> {
  if (!canCreateReport(ctx)) return { ok: false, error: "Insufficient rights" };
  const report = await repo.getById(supabase, reportId, ctx.tenantId);
  if (!report) return { ok: false, error: "Report not found" };
  if (report.user_id !== ctx.userId) return { ok: false, error: "Not your report" };
  if (report.status !== "draft") return { ok: false, error: "Report already submitted" };
  const ok = await repo.addMedia(supabase, reportId, opts);
  return { ok, error: ok ? "" : "Failed to add media" };
}

export async function submitReport(
  supabase: SupabaseClient,
  ctx: TenantContext,
  reportId: string
): Promise<{ ok: boolean; error: string }> {
  if (!canCreateReport(ctx)) return { ok: false, error: "Insufficient rights" };
  const report = await repo.getById(supabase, reportId, ctx.tenantId);
  if (!report) return { ok: false, error: "Report not found" };
  if (report.user_id !== ctx.userId) return { ok: false, error: "Not your report" };
  if (report.status !== "draft") return { ok: false, error: "Report already submitted" };
  const ok = await repo.submit(supabase, reportId, ctx.tenantId);
  return { ok, error: ok ? "" : "Failed to submit" };
}
