import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { listTasksForToday } from "@/lib/domain/tasks/task.service";
import {
  filterWorkerSyncReportsDelta,
  mergeWorkerSyncReports,
  type WorkerSyncReportRow,
} from "@/lib/domain/reports/worker-sync-reports";
import { getOrCreateTraceId } from "@/lib/observability";

export const dynamic = "force-dynamic";

const REPORT_SYNC_COLS = "id, status, created_at, submitted_at" as const;

/**
 * Lightweight sync for mobile: tasks, report statuses, upload session statuses since timestamp.
 * Returns delta items. Pagination token optional for Phase 2.
 */
export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  const traceId = getOrCreateTraceId(request);
  const serverTime = new Date().toISOString();
  const url = new URL(request.url);
  const since = url.searchParams.get("since"); // ISO timestamp; optional

  const supabase = await createClientFromRequest(request);
  const { data: tasks } = await listTasksForToday(supabase, ctx);

  // Always fetch actionable feedback first so older changes_requested rows are not
  // crowded out of the newest-created top-50 window used by Worker home.
  const { data: feedbackReports, error: feedbackError } = await supabase
    .from("worker_reports")
    .select(REPORT_SYNC_COLS)
    .eq("tenant_id", ctx.tenantId)
    .eq("user_id", ctx.userId)
    .eq("status", "changes_requested")
    .order("reviewed_at", { ascending: false })
    .limit(50);

  const { data: reports, error: reportsError } = await supabase
    .from("worker_reports")
    .select(REPORT_SYNC_COLS)
    .eq("tenant_id", ctx.tenantId)
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (feedbackError || reportsError) {
    return NextResponse.json({ error: "reports_unavailable" }, { status: 503 });
  }

  const reportList = mergeWorkerSyncReports(
    (feedbackReports ?? []) as WorkerSyncReportRow[],
    (reports ?? []) as WorkerSyncReportRow[]
  );
  const reportsDelta = filterWorkerSyncReportsDelta(reportList, since);

  const { data: sessions, error: sessionsError } = await supabase
    .from("upload_sessions")
    .select("id, status, created_at")
    .eq("tenant_id", ctx.tenantId)
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (sessionsError) {
    return NextResponse.json({ error: "upload_sessions_unavailable" }, { status: 503 });
  }

  const sessionList = (sessions ?? []) as { id: string; status: string; created_at: string }[];
  const sessionsDelta = since ? sessionList.filter((s) => s.created_at >= since) : sessionList;

  return NextResponse.json({
    serverTime,
    traceId,
    data: {
      tasks: tasks ?? [],
      reports: reportsDelta,
      uploadSessions: sessionsDelta,
    },
    pagination: null,
  });
}
