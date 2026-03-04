import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canCreateReport } from "./report.policy";
import * as repo from "./report.repository";
import type { Report } from "./report.types";
import { enqueueJob } from "@/lib/platform/jobs/job.service";
import { emitAudit } from "@/lib/observability/audit.service";
import { emitChange } from "@/lib/sync/change-log.repository";

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
  reportId: string,
  traceId?: string | null
): Promise<{ ok: boolean; error: string; jobIds?: string[] }> {
  if (!canCreateReport(ctx)) return { ok: false, error: "Insufficient rights" };
  const report = await repo.getById(supabase, reportId, ctx.tenantId);
  if (!report) return { ok: false, error: "Report not found" };
  if (report.user_id !== ctx.userId) return { ok: false, error: "Not your report" };
  if (report.status !== "draft") return { ok: false, error: "Report already submitted" };
  const ok = await repo.submit(supabase, reportId, ctx.tenantId);
  if (!ok) return { ok: false, error: "Failed to submit" };

  await emitAudit(supabase, {
    tenant_id: ctx.tenantId,
    user_id: ctx.userId,
    trace_id: traceId ?? null,
    action: "report_submit",
    resource_type: "report",
    resource_id: reportId,
  });
  await emitChange(supabase, {
    tenant_id: ctx.tenantId,
    resource_type: "report",
    resource_id: reportId,
    change_type: "updated",
    changed_by: ctx.userId,
    payload: { status: "submitted" },
  });

  const jobIds: string[] = [];
  try {
    const reportJob = await enqueueJob(supabase, {
      tenant_id: ctx.tenantId,
      user_id: ctx.userId,
      type: "ai_analyze_report",
      payload: { report_id: reportId },
      trace_id: traceId ?? null,
    });
    if (reportJob) jobIds.push(reportJob.id);

    const mediaRows = await repo.listMediaByReportId(supabase, reportId, ctx.tenantId);
    for (const row of mediaRows) {
      if (row.media_id || row.upload_session_id) {
        const mediaJob = await enqueueJob(supabase, {
          tenant_id: ctx.tenantId,
          user_id: ctx.userId,
          type: "ai_analyze_media",
          payload: {
            report_id: reportId,
            media_id: row.media_id ?? undefined,
            upload_session_id: row.upload_session_id ?? undefined,
          },
          trace_id: traceId ?? null,
        });
        if (mediaJob) jobIds.push(mediaJob.id);
      }
    }
  } catch {
    /* enqueue best-effort; still return success with whatever jobIds we have */
  }
  return { ok: true, error: "", jobIds };
}
