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
import { notifyProjectManagers, notifyTenantManagers } from "@/lib/domain/notifications/manager-notifications.repository";
import * as uploadSessionRepo from "@/lib/domain/upload-session/upload-session.repository";
import * as mediaRepo from "@/lib/domain/media/media.repository";

const REPORT_UPLOAD_PURPOSES = new Set(["report_before", "report_after"]);

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

/**
 * Photo proof must reference a real finalized report upload session owned by the
 * worker, or a tenant-scoped media row with a file URL. Caller-controlled IDs alone
 * must not satisfy the proof gate.
 */
export async function isValidReportPhotoProof(
  supabase: SupabaseClient,
  ctx: TenantContext,
  opts: { mediaId?: string | null; uploadSessionId?: string | null }
): Promise<boolean> {
  const uploadSessionId = (opts.uploadSessionId ?? "").trim();
  const mediaId = (opts.mediaId ?? "").trim();

  if (uploadSessionId) {
    const session = await uploadSessionRepo.getById(supabase, uploadSessionId, ctx.tenantId);
    if (
      session &&
      session.user_id === ctx.userId &&
      session.status === "finalized" &&
      REPORT_UPLOAD_PURPOSES.has(session.purpose) &&
      (session.object_path ?? "").trim()
    ) {
      return true;
    }
  }

  if (mediaId) {
    const media = await mediaRepo.getById(supabase, mediaId, ctx.tenantId);
    if (media && (media.file_url ?? "").trim()) return true;
  }

  return false;
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
  const proofOk = await isValidReportPhotoProof(supabase, ctx, {
    mediaId: opts.mediaId,
    uploadSessionId: opts.uploadSessionId,
  });
  if (!proofOk) return { ok: false, error: "Invalid photo proof" };
  const ok = await repo.addMedia(supabase, reportId, opts);
  return { ok, error: ok ? "" : "Failed to add media" };
}

export async function submitReport(
  supabase: SupabaseClient,
  ctx: TenantContext,
  reportId: string,
  traceId?: string | null,
  options?: { taskId?: string | null; workerNote?: string | null }
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

  const mediaRows = await repo.listMediaByReportId(supabase, reportId, ctx.tenantId);
  let hasPhotoProof = false;
  for (const row of mediaRows) {
    if (
      await isValidReportPhotoProof(supabase, ctx, {
        mediaId: row.media_id,
        uploadSessionId: row.upload_session_id,
      })
    ) {
      hasPhotoProof = true;
      break;
    }
  }
  if (!hasPhotoProof) {
    return { ok: false, error: "Photo proof required", code: "proof_required" };
  }

  const ok =
    report.status === "changes_requested"
      ? await repo.resubmit(supabase, reportId, ctx.tenantId, taskId ?? undefined, options?.workerNote ?? null)
      : await repo.submit(supabase, reportId, ctx.tenantId, taskId ?? undefined, options?.workerNote ?? null);
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

  const projectId = await repo.getProjectIdForReport(supabase, ctx.tenantId, report);
  const input = {
    type: "report_submitted" as const,
    title: "New report submitted",
    body: `Report ${reportId.slice(0, 8)}…`,
    target_type: "report" as const,
    target_id: reportId,
    project_id: projectId,
  };
  if (projectId) {
    await notifyProjectManagers(supabase, ctx.tenantId, projectId, input);
  } else {
    await notifyTenantManagers(supabase, ctx.tenantId, input);
  }

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
