import type { SupabaseClient } from "@supabase/supabase-js";

export interface ReportListRow {
  id: string;
  user_id: string;
  day_id: string | null;
  status: string;
  created_at: string;
  submitted_at: string | null;
  project_id: string | null;
  task_id: string | null;
}

/**
 * List reports for manager (tenant-scoped). Optional filter by project_id (via worker_day), user_id, from, to, q (search by id or user_id prefix/contains).
 */
export async function listReportsForManager(
  supabase: SupabaseClient,
  tenantId: string,
  opts: { projectId?: string; userId?: string; from?: string; to?: string; limit?: number; q?: string } = {}
): Promise<ReportListRow[]> {
  const limit = opts.limit ?? 50;
  let query = supabase
    .from("worker_reports")
    .select("id, user_id, day_id, status, created_at, submitted_at, task_id")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  if (opts.from) query = query.gte("created_at", opts.from);
  if (opts.to) query = query.lte("created_at", opts.to);
  if (opts.userId) query = query.eq("user_id", opts.userId);

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

  let result: ReportListRow[] = (rows as { id: string; user_id: string; day_id: string | null; status: string; created_at: string; submitted_at: string | null; task_id: string | null }[]).map((r) => ({
    ...r,
    project_id: r.day_id ? dayProjectMap[r.day_id] ?? null : null,
  }));

  if (opts.projectId) {
    result = result.filter((r) => r.project_id === opts.projectId);
  }
  if (opts.q?.trim()) {
    const q = opts.q.trim().toLowerCase();
    result = result.filter(
      (r) =>
        r.id.toLowerCase().startsWith(q) ||
        r.id.toLowerCase().includes(q) ||
        r.user_id.toLowerCase().startsWith(q) ||
        r.user_id.toLowerCase().includes(q) ||
        (r.project_id ?? "").toLowerCase().includes(q)
    );
  }
  return result.slice(0, limit);
}
