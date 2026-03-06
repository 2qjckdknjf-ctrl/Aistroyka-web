import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProjectWorkerRow {
  user_id: string;
  role: string;
  status: string;
  created_at: string;
}

export interface ProjectReportRow {
  id: string;
  user_id: string;
  day_id: string | null;
  status: string;
  created_at: string;
  submitted_at: string | null;
}

export interface ProjectUploadRow {
  id: string;
  tenant_id: string;
  user_id: string;
  purpose: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export interface ProjectAiRow {
  id: string;
  media_id: string;
  status: string;
  created_at: string;
}

/**
 * List workers (project_members) for a project. Tenant-scoped, paginated.
 */
export async function listProjectWorkers(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  opts: { limit?: number; offset?: number } = {}
): Promise<{ rows: ProjectWorkerRow[]; total: number }> {
  const limit = Math.min(opts.limit ?? 50, 100);
  const offset = opts.offset ?? 0;

  const countRes = await supabase
    .from("project_members")
    .select("user_id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("status", "active");

  const { data: rows, error } = await supabase
    .from("project_members")
    .select("user_id, role, status, created_at")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { rows: [], total: countRes.count ?? 0 };
  return {
    rows: (rows ?? []) as ProjectWorkerRow[],
    total: countRes.count ?? 0,
  };
}

/**
 * List reports for a project (reports by project members). Tenant-scoped, paginated.
 */
export async function listProjectReports(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  opts: { limit?: number; offset?: number } = {}
): Promise<{ rows: ProjectReportRow[]; total: number }> {
  const limit = Math.min(opts.limit ?? 50, 100);
  const offset = opts.offset ?? 0;

  const { data: members } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("status", "active");
  const userIds = (members ?? []).map((m) => (m as { user_id: string }).user_id);
  if (userIds.length === 0) return { rows: [], total: 0 };

  const countRes = await supabase
    .from("worker_reports")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .in("user_id", userIds);

  const { data: rows, error } = await supabase
    .from("worker_reports")
    .select("id, user_id, day_id, status, created_at, submitted_at")
    .eq("tenant_id", tenantId)
    .in("user_id", userIds)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { rows: [], total: countRes.count ?? 0 };
  return {
    rows: (rows ?? []) as ProjectReportRow[],
    total: countRes.count ?? 0,
  };
}

/**
 * List upload sessions linked to project (via report media for project members). Tenant-scoped, paginated.
 */
export async function listProjectUploads(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  opts: { limit?: number; offset?: number } = {}
): Promise<{ rows: ProjectUploadRow[]; total: number }> {
  const limit = Math.min(opts.limit ?? 50, 100);
  const offset = opts.offset ?? 0;

  const { data: members } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("status", "active");
  const userIds = (members ?? []).map((m) => (m as { user_id: string }).user_id);
  if (userIds.length === 0) return { rows: [], total: 0 };

  const { data: reports } = await supabase
    .from("worker_reports")
    .select("id")
    .eq("tenant_id", tenantId)
    .in("user_id", userIds);
  const reportIds = (reports ?? []).map((r) => (r as { id: string }).id);
  if (reportIds.length === 0) return { rows: [], total: 0 };

  const { data: mediaRows } = await supabase
    .from("worker_report_media")
    .select("upload_session_id")
    .in("report_id", reportIds)
    .not("upload_session_id", "is", null);
  const sessionIds = Array.from(
    new Set((mediaRows ?? []).map((m) => (m as { upload_session_id: string }).upload_session_id))
  ).slice(0, 1000);
  if (sessionIds.length === 0) return { rows: [], total: 0 };

  const { data: sessions } = await supabase
    .from("upload_sessions")
    .select("id, tenant_id, user_id, purpose, status, created_at, expires_at")
    .eq("tenant_id", tenantId)
    .in("id", sessionIds)
    .order("created_at", { ascending: false });

  const ordered = (sessions ?? []) as ProjectUploadRow[];
  const total = ordered.length;
  const page = ordered.slice(offset, offset + limit);
  return { rows: page, total };
}

/**
 * List AI analysis jobs for project media. Tenant-scoped, paginated.
 */
export async function listProjectAi(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  opts: { limit?: number; offset?: number } = {}
): Promise<{ rows: ProjectAiRow[]; total: number }> {
  const limit = Math.min(opts.limit ?? 50, 100);
  const offset = opts.offset ?? 0;

  const { data: mediaRows } = await supabase
    .from("media")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId);
  const mediaIds = (mediaRows ?? []).map((m) => (m as { id: string }).id);
  if (mediaIds.length === 0) return { rows: [], total: 0 };

  const countRes = await supabase
    .from("analysis_jobs")
    .select("id", { count: "exact", head: true })
    .in("media_id", mediaIds);

  const { data: rows, error } = await supabase
    .from("analysis_jobs")
    .select("id, media_id, status, created_at")
    .in("media_id", mediaIds)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { rows: [], total: countRes.count ?? 0 };
  return {
    rows: (rows ?? []) as ProjectAiRow[],
    total: countRes.count ?? 0,
  };
}
