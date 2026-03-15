import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canCreateReport } from "./report.policy";
import * as repo from "./report.repository";
import type { Report } from "./report.types";
import * as taskRepo from "@/lib/domain/tasks/task.repository";
import { isTaskAssignedTo } from "@/lib/domain/task-assignments";
import { enqueueJob } from "@/lib/platform/jobs/job.service";
import { emitAudit } from "@/lib/observability/audit.service";
import { emitChange } from "@/lib/sync/change-log.repository";
import { notifyTenantManagers } from "@/lib/domain/notifications/manager-notifications.repository";

/** Returns { ok, code? }. code = task_invalid | task_not_assigned when not ok. */
export async function validateTaskForReportLink(
  supabase: SupabaseClient,
  tenantId: string,
  taskId: string,
  userId: string
): Promise<{ ok: true } | { ok: false; code: "task_invalid" | "task_not_assigned" }> {
  const task = await taskRepo.getById(supabase, taskId, tenantId);
  if (!task) return { ok: false, code: "task_invalid" };
  if (task.assigned_to === userId) return { ok: true };
  const assigned = await isTaskAssignedTo(supabase, tenantId, taskId, userId);
  return assigned ? { ok: true } : { ok: false, code: "task_not_assigned" };
}

export async function createReport(
  supabase: SupabaseClient,
  ctx: TenantContext,
  options?: { dayId?: string | null; taskId?: string | null }
): Promise<{ data: Report | null; error: string; code?: string }> {
  if (!canCreateReport(ctx)) return { data: null, error: "Insufficient rights" };
  let taskId: string | null = null;
  if (options?.taskId != null && options.taskId !== "") {
    const v = await validateTaskForReportLink(supabase, ctx.tenantId, options.taskId, ctx.userId);
    if (!v.ok) return { data: null, error: v.code, code: v.code };
    taskId = options.taskId;
  }
  const data = await repo.create(supabase, ctx.tenantId, ctx.userId, options?.dayId ?? null, taskId);
  if (!data) return { data: null, error: "Failed to create report" };
  await emitChange(supabase, {
    tenant_id: ctx.tenantId,
    resource_type: "report",
    resource_id: data.id,
    change_type: "created",
    changed_by: ctx.userId,
    payload: { status: "draft" },
  });
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
  traceId?: string | null,
  options?: { taskId?: string | null }
): Promise<{ ok: boolean; error: string; code?: string; jobIds?: string[] }> {
  if (!canCreateReport(ctx)) return { ok: false, error: "Insufficient rights" };
  const report = await repo.getById(supabase, reportId, ctx.tenantId);
  if (!report) return { ok: false, error: "Report not found" };
  if (report.user_id !== ctx.userId) return { ok: false, error: "Not your report" };
  if (report.status !== "draft" && report.status !== "changes_requested") {
    return { ok: false, error: "Report already submitted" };
  }
  let taskId: string | null | undefined = report.task_id ?? undefined;
  if (taskId === undefined && options?.taskId != null && options.taskId !== "") {
    const v = await validateTaskForReportLink(supabase, ctx.tenantId, options.taskId, ctx.userId);
    if (!v.ok) return { ok: false, error: v.code, code: v.code };
    taskId = options.taskId;
  }
  const ok =
    report.status === "changes_requested"
      ? await repo.resubmit(supabase, reportId, ctx.tenantId, taskId ?? undefined)
      : await repo.submit(supabase, reportId, ctx.tenantId, taskId ?? undefined);
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

  await notifyTenantManagers(supabase, ctx.tenantId, {
    type: "report_submitted",
    title: "New report submitted",
    body: `Report ${reportId.slice(0, 8)}…`,
    target_type: "report",
    target_id: reportId,
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
