import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicConfig } from "@/lib/config";
import { publicMediaObjectUrl } from "@/lib/media/path-in-media-bucket";
import type { Report } from "./report.types";

export async function create(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  dayId?: string | null,
  taskId?: string | null
): Promise<Report | null> {
  const row: Record<string, unknown> = {
    tenant_id: tenantId,
    user_id: userId,
    day_id: dayId ?? null,
    status: "draft",
  };
  if (taskId != null && taskId !== "") row.task_id = taskId;
  const { data, error } = await supabase
    .from("worker_reports")
    .insert(row)
    .select("id, tenant_id, user_id, day_id, status, created_at, submitted_at, task_id")
    .single();
  if (error || !data) return null;
  return data as Report;
}

export const BOOTSTRAP_REPORT_COLS = "id, status, created_at, submitted_at" as const;

export async function listForBootstrap(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  limit: number = 100
): Promise<{ id: string; status: string; created_at: string; submitted_at: string | null }[]> {
  const { data, error } = await supabase
    .from("worker_reports")
    .select(BOOTSTRAP_REPORT_COLS)
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as { id: string; status: string; created_at: string; submitted_at: string | null }[];
}

const REPORT_SELECT =
  "id, tenant_id, user_id, day_id, status, created_at, submitted_at, task_id, reviewed_at, reviewed_by, manager_note, worker_note";

export async function getById(
  supabase: SupabaseClient,
  reportId: string,
  tenantId: string
): Promise<Report | null> {
  const { data, error } = await supabase
    .from("worker_reports")
    .select(REPORT_SELECT)
    .eq("id", reportId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Report;
}

export async function addMedia(
  supabase: SupabaseClient,
  reportId: string,
  opts: { mediaId?: string; uploadSessionId?: string }
): Promise<boolean> {
  const { mediaId, uploadSessionId } = opts;
  if (!mediaId && !uploadSessionId) return false;
  const { error } = await supabase.from("worker_report_media").insert({
    report_id: reportId,
    media_id: mediaId ?? null,
    upload_session_id: uploadSessionId ?? null,
    sort_order: 0,
  });
  return !error;
}

function updateMatched(data: unknown[] | null, error: { message?: string } | null): boolean {
  // PostgREST returns no error when 0 rows match the filter; treat that as failure
  // so callers do not emit duplicate notifications / AI jobs on lost races.
  return !error && Array.isArray(data) && data.length > 0;
}

export async function submit(
  supabase: SupabaseClient,
  reportId: string,
  tenantId: string,
  taskId?: string | null,
  workerNote?: string | null
): Promise<boolean> {
  const updates: Record<string, unknown> = { status: "submitted", submitted_at: new Date().toISOString() };
  if (taskId != null && taskId !== "") (updates as Record<string, unknown>).task_id = taskId;
  if (workerNote != null) (updates as Record<string, unknown>).worker_note = workerNote;
  const { data, error } = await supabase
    .from("worker_reports")
    .update(updates)
    .eq("id", reportId)
    .eq("tenant_id", tenantId)
    .eq("status", "draft")
    .select("id");
  return updateMatched(data as unknown[] | null, error);
}

/** Resubmit after changes_requested. Keeps reviewed_at/reviewed_by/manager_note for history. */
export async function resubmit(
  supabase: SupabaseClient,
  reportId: string,
  tenantId: string,
  taskId?: string | null,
  workerNote?: string | null
): Promise<boolean> {
  const updates: Record<string, unknown> = { status: "submitted", submitted_at: new Date().toISOString() };
  if (taskId != null && taskId !== "") (updates as Record<string, unknown>).task_id = taskId;
  if (workerNote != null) (updates as Record<string, unknown>).worker_note = workerNote;
  const { data, error } = await supabase
    .from("worker_reports")
    .update(updates)
    .eq("id", reportId)
    .eq("tenant_id", tenantId)
    .eq("status", "changes_requested")
    .select("id");
  return updateMatched(data as unknown[] | null, error);
}

/** Resolve project_id for a report (from task_id or day_id). */
export async function getProjectIdForReport(
  supabase: SupabaseClient,
  tenantId: string,
  report: { task_id?: string | null; day_id?: string | null }
): Promise<string | null> {
  if (report.task_id) {
    const { data } = await supabase
      .from("worker_tasks")
      .select("project_id")
      .eq("id", report.task_id)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if ((data as { project_id?: string } | null)?.project_id) return (data as { project_id: string }).project_id;
  }
  if (report.day_id) {
    const { data } = await supabase
      .from("worker_day")
      .select("project_id")
      .eq("id", report.day_id)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if ((data as { project_id?: string } | null)?.project_id) return (data as { project_id: string }).project_id;
  }
  return null;
}

export type ReportReviewStatus = "approved" | "rejected" | "changes_requested";

export interface UpdateReportReviewInput {
  status: ReportReviewStatus;
  manager_note?: string | null;
}

/** Manager review: only from submitted. Sets reviewed_at, reviewed_by, manager_note. */
export async function updateReview(
  supabase: SupabaseClient,
  reportId: string,
  tenantId: string,
  reviewerId: string,
  input: UpdateReportReviewInput
): Promise<Report | null> {
  const { data: existing } = await supabase
    .from("worker_reports")
    .select("id, status")
    .eq("id", reportId)
    .eq("tenant_id", tenantId)
    .eq("status", "submitted")
    .maybeSingle();
  if (!existing) return null;

  const updates: Record<string, unknown> = {
    status: input.status,
    reviewed_at: new Date().toISOString(),
    reviewed_by: reviewerId,
    manager_note: input.manager_note ?? null,
  };
  const { data, error } = await supabase
    .from("worker_reports")
    .update(updates)
    .eq("id", reportId)
    .eq("tenant_id", tenantId)
    .eq("status", "submitted")
    .select(REPORT_SELECT)
    .single();
  if (error || !data) return null;
  return data as Report;
}


export interface ReportMediaRow {
  media_id: string | null;
  upload_session_id: string | null;
}

export async function listMediaByReportId(
  supabase: SupabaseClient,
  reportId: string,
  _tenantId: string
): Promise<ReportMediaRow[]> {
  const { data, error } = await supabase
    .from("worker_report_media")
    .select("media_id, upload_session_id")
    .eq("report_id", reportId);
  if (error) return [];
  return (data ?? []) as ReportMediaRow[];
}

export type ReportMediaRowWithUrl = ReportMediaRow & { file_url: string | null };

/** Same resolution as job `resolve-image-url`: `media.file_url` or public storage URL from finalized session. */
export async function listMediaByReportIdWithUrls(
  supabase: SupabaseClient,
  reportId: string,
  tenantId: string
): Promise<ReportMediaRowWithUrl[]> {
  const rows = await listMediaByReportId(supabase, reportId, tenantId);
  if (rows.length === 0) return [];

  const mediaIds = rows.map((r) => r.media_id).filter((id): id is string => Boolean(id));
  const sessionIds = rows.map((r) => r.upload_session_id).filter((id): id is string => Boolean(id));

  const urlByMediaId = new Map<string, string>();
  if (mediaIds.length > 0) {
    const { data } = await supabase.from("media").select("id, file_url").in("id", mediaIds);
    for (const row of data ?? []) {
      const m = row as { id: string; file_url?: string | null };
      if (m.id && typeof m.file_url === "string" && m.file_url) urlByMediaId.set(m.id, m.file_url);
    }
  }

  const pathBySessionId = new Map<string, string>();
  if (sessionIds.length > 0) {
    const { data } = await supabase
      .from("upload_sessions")
      .select("id, object_path, status")
      .in("id", sessionIds);
    for (const row of data ?? []) {
      const s = row as { id: string; object_path?: string | null; status?: string | null };
      if (s.status === "finalized" && typeof s.object_path === "string" && s.object_path) {
        pathBySessionId.set(s.id, s.object_path);
      }
    }
  }

  let baseUrl = "";
  try {
    baseUrl = getPublicConfig().NEXT_PUBLIC_SUPABASE_URL ?? "";
  } catch {
    baseUrl = "";
  }

  return rows.map((row) => {
    let file_url: string | null = null;
    if (row.media_id) {
      file_url = urlByMediaId.get(row.media_id) ?? null;
    }
    if (!file_url && row.upload_session_id) {
      const objectPath = pathBySessionId.get(row.upload_session_id);
      if (objectPath && baseUrl) {
        file_url = publicMediaObjectUrl(baseUrl, objectPath);
      }
    }
    return { ...row, file_url };
  });
}
