import type { SupabaseClient } from "@supabase/supabase-js";

export interface ReportListRow {
  id: string;
  user_id: string;
  day_id: string | null;
  status: string;
  created_at: string;
  submitted_at: string | null;
  project_id: string | null;
}

/**
 * List reports for manager (tenant-scoped). Optional filter by project_id (via worker_day).
 */
export async function listReportsForManager(
  supabase: SupabaseClient,
  tenantId: string,
  opts: { projectId?: string; from?: string; to?: string; limit?: number } = {}
): Promise<ReportListRow[]> {
  const limit = opts.limit ?? 50;
  let query = supabase
    .from("worker_reports")
    .select("id, user_id, day_id, status, created_at, submitted_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const { data: rows } = await query;
  if (!rows?.length) return [];

  const dayIds = Array.from(new Set((rows as { day_id: string | null }[]).map((r) => r.day_id).filter(Boolean))) as string[];
  let dayProjectMap: Record<string, string> = {};
  if (dayIds.length > 0) {
    const { data: dayRows } = await supabase
      .from("worker_day")
      .select("id, project_id")
      .in("id", dayIds);
    dayProjectMap = Object.fromEntries(
      ((dayRows ?? []) as { id: string; project_id: string | null }[]).map((d) => [d.id, d.project_id ?? ""])
    );
  }

  let result: ReportListRow[] = (rows as { id: string; user_id: string; day_id: string | null; status: string; created_at: string; submitted_at: string | null }[]).map((r) => ({
    ...r,
    project_id: r.day_id ? dayProjectMap[r.day_id] ?? null : null,
  }));

  if (opts.projectId) {
    result = result.filter((r) => r.project_id === opts.projectId);
  }
  if (opts.from) {
    result = result.filter((r) => r.created_at >= opts.from!);
  }
  if (opts.to) {
    result = result.filter((r) => r.created_at <= opts.to!);
  }
  return result;
}
