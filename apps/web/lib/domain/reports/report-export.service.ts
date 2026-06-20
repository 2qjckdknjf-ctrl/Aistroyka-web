import type { SupabaseClient } from "@supabase/supabase-js";

export const REPORT_EXPORT_COLUMNS = [
  "report_id",
  "project_id",
  "worker_user_id",
  "status",
  "created_at",
  "submitted_at",
  "reviewed_at",
  "media_count",
  "analysis_status",
] as const;

export type ReportExportColumn = (typeof REPORT_EXPORT_COLUMNS)[number];

export type ReportExportAnalysisStatus = "none" | "queued" | "running" | "success" | "failed";

export interface ReportExportRow {
  report_id: string;
  project_id: string | null;
  worker_user_id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  media_count: number;
  analysis_status: ReportExportAnalysisStatus;
}

interface WorkerReportRow {
  id: string;
  user_id: string;
  day_id: string | null;
  task_id: string | null;
  status: string;
  created_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
}

export interface ReportExportFilters {
  projectId?: string;
  status?: string;
  from?: string;
  to?: string;
  rangeDays?: number;
  limit?: number;
}

const MAX_EXPORT_ROWS = 1000;
const FORMULA_PREFIX = /^[=+\-@]/;

export function escapeCsvValue(value: string | number | null | undefined): string {
  let text = value == null ? "" : String(value);
  if (FORMULA_PREFIX.test(text)) text = `'${text}`;
  if (text.includes(",") || text.includes('"') || text.includes("\n") || text.includes("\r")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildReportsCsv(rows: ReportExportRow[]): string {
  const header = REPORT_EXPORT_COLUMNS.join(",");
  const body = rows.map((row) =>
    REPORT_EXPORT_COLUMNS.map((column) => escapeCsvValue(row[column])).join(",")
  );
  return [header, ...body].join("\r\n") + "\r\n";
}

export async function generateReportsExportCsv(
  supabase: SupabaseClient,
  tenantId: string,
  filters: ReportExportFilters = {}
): Promise<string> {
  const rows = await listReportExportRows(supabase, tenantId, filters);
  return buildReportsCsv(rows);
}

async function listReportExportRows(
  supabase: SupabaseClient,
  tenantId: string,
  filters: ReportExportFilters
): Promise<ReportExportRow[]> {
  const limit = Math.min(Math.max(filters.limit ?? MAX_EXPORT_ROWS, 1), MAX_EXPORT_ROWS);
  const dateFilters = resolveDateFilters(filters);
  let query = supabase
    .from("worker_reports")
    .select("id, user_id, day_id, task_id, status, created_at, submitted_at, reviewed_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  if (filters.status) query = query.eq("status", filters.status);
  if (dateFilters.from) query = query.gte("created_at", dateFilters.from);
  if (dateFilters.to) query = query.lte("created_at", dateFilters.to);

  const { data } = await query;
  const reportRows = ((data ?? []) as WorkerReportRow[]).slice(0, limit * 2);
  if (reportRows.length === 0) return [];

  const projectByDay = await loadProjectIdsByDay(supabase, reportRows);
  const projectByTask = await loadProjectIdsByTask(supabase, tenantId, reportRows);
  const rowsWithProject = reportRows.map((row) => {
    const projectId = (row.day_id ? projectByDay.get(row.day_id) : null) ?? (row.task_id ? projectByTask.get(row.task_id) : null) ?? null;
    return { row, projectId };
  });

  const scopedRows = filters.projectId
    ? rowsWithProject.filter(({ projectId }) => projectId === filters.projectId)
    : rowsWithProject;
  const limitedRows = scopedRows.slice(0, limit);
  const reportIds = limitedRows.map(({ row }) => row.id);
  const [mediaCountByReport, analysisStatusByReport] = await Promise.all([
    loadMediaCounts(supabase, reportIds),
    loadAnalysisStatuses(supabase, tenantId, reportIds),
  ]);

  return limitedRows.map(({ row, projectId }) => ({
    report_id: row.id,
    project_id: projectId,
    worker_user_id: row.user_id,
    status: row.status,
    created_at: row.created_at,
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at,
    media_count: mediaCountByReport.get(row.id) ?? 0,
    analysis_status: analysisStatusByReport.get(row.id) ?? "none",
  }));
}

function resolveDateFilters(filters: ReportExportFilters): { from?: string; to?: string } {
  if (filters.from || filters.to) return { from: filters.from, to: filters.to };
  if (!filters.rangeDays) return {};
  const rangeDays = Math.min(Math.max(filters.rangeDays, 1), 365);
  const from = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString();
  return { from };
}

async function loadProjectIdsByDay(
  supabase: SupabaseClient,
  rows: WorkerReportRow[]
): Promise<Map<string, string>> {
  const dayIds = Array.from(new Set(rows.map((row) => row.day_id).filter((id): id is string => Boolean(id))));
  if (dayIds.length === 0) return new Map();
  const { data } = await supabase.from("worker_day").select("id, project_id").in("id", dayIds);
  return new Map(
    ((data ?? []) as { id: string; project_id: string | null }[])
      .filter((row) => row.project_id)
      .map((row) => [row.id, row.project_id as string])
  );
}

async function loadProjectIdsByTask(
  supabase: SupabaseClient,
  tenantId: string,
  rows: WorkerReportRow[]
): Promise<Map<string, string>> {
  const taskIds = Array.from(new Set(rows.map((row) => row.task_id).filter((id): id is string => Boolean(id))));
  if (taskIds.length === 0) return new Map();
  const { data } = await supabase
    .from("worker_tasks")
    .select("id, project_id")
    .eq("tenant_id", tenantId)
    .in("id", taskIds);
  return new Map(
    ((data ?? []) as { id: string; project_id: string | null }[])
      .filter((row) => row.project_id)
      .map((row) => [row.id, row.project_id as string])
  );
}

async function loadMediaCounts(
  supabase: SupabaseClient,
  reportIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  reportIds.forEach((id) => counts.set(id, 0));
  if (reportIds.length === 0) return counts;
  const { data } = await supabase.from("worker_report_media").select("report_id").in("report_id", reportIds);
  for (const row of (data ?? []) as { report_id: string }[]) {
    counts.set(row.report_id, (counts.get(row.report_id) ?? 0) + 1);
  }
  return counts;
}

async function loadAnalysisStatuses(
  supabase: SupabaseClient,
  tenantId: string,
  reportIds: string[]
): Promise<Map<string, ReportExportAnalysisStatus>> {
  const statuses = new Map<string, ReportExportAnalysisStatus>();
  if (reportIds.length === 0) return statuses;
  const { data } = await supabase
    .from("jobs")
    .select("status, payload")
    .eq("tenant_id", tenantId)
    .or("type.eq.ai_analyze_report,type.eq.ai_analyze_media")
    .limit(1000);

  for (const job of (data ?? []) as { status: string; payload?: { report_id?: string } }[]) {
    const reportId = job.payload?.report_id;
    if (!reportId || !reportIds.includes(reportId)) continue;
    const current = statuses.get(reportId);
    if (job.status === "running") statuses.set(reportId, "running");
    else if (job.status === "success" && current !== "running") statuses.set(reportId, "success");
    else if ((job.status === "failed" || job.status === "dead") && current !== "running" && current !== "success") {
      statuses.set(reportId, "failed");
    } else if (!current) {
      statuses.set(reportId, "queued");
    }
  }
  return statuses;
}
