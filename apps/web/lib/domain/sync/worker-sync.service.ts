/**
 * Worker sync service - handles lightweight sync for mobile workers.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { listTasksForToday } from "@/lib/domain/tasks/task.service";
import * as reportRepo from "./worker-sync.repository";
import type { WorkerReportDelta, UploadSessionDelta } from "./worker-sync.repository";

export interface WorkerSyncData {
  tasks: Awaited<ReturnType<typeof listTasksForToday>>["data"];
  reports: WorkerReportDelta[];
  uploadSessions: UploadSessionDelta[];
}

/**
 * Get sync delta for worker (tasks, reports, upload sessions since timestamp).
 */
export async function getWorkerSyncDelta(
  supabase: SupabaseClient,
  ctx: TenantContext,
  since?: string | null
): Promise<{ data: WorkerSyncData; error: string }> {
  if (!ctx.tenantId || !ctx.userId) {
    return { data: { tasks: [], reports: [], uploadSessions: [] }, error: "Unauthorized" };
  }

  // Get tasks
  const { data: tasks } = await listTasksForToday(supabase, ctx);

  // Get reports
  const reportList = await reportRepo.listReportsForSync(supabase, ctx.tenantId, ctx.userId, 50);
  const reportsDelta = since
    ? reportList.filter((r) => r.created_at >= since || (r.submitted_at && r.submitted_at >= since))
    : reportList;

  // Get upload sessions
  const sessionList = await reportRepo.listUploadSessionsForSync(supabase, ctx.tenantId, ctx.userId, 50);
  const sessionsDelta = since ? sessionList.filter((s) => s.created_at >= since) : sessionList;

  return {
    data: {
      tasks: tasks ?? [],
      reports: reportsDelta,
      uploadSessions: sessionsDelta,
    },
    error: "",
  };
}
