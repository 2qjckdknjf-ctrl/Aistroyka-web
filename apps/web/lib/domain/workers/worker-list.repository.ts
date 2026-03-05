import type { SupabaseClient } from "@supabase/supabase-js";

export interface WorkerListRow {
  user_id: string;
  last_day_date: string | null;
  last_started_at: string | null;
  last_ended_at: string | null;
  last_report_submitted_at: string | null;
}

/**
 * List workers (distinct user_ids) with last day and last report (tenant-scoped). Read-only for managers.
 */
export async function listWorkersWithLastActivity(
  supabase: SupabaseClient,
  tenantId: string,
  limit: number = 100
): Promise<WorkerListRow[]> {
  const { data: days } = await supabase
    .from("worker_day")
    .select("user_id, day_date, started_at, ended_at")
    .eq("tenant_id", tenantId)
    .order("day_date", { ascending: false })
    .limit(2000);

  if (!days?.length) return [];

  const byUser = new Map<string, { day_date: string; started_at: string | null; ended_at: string | null }>();
  for (const d of days as { user_id: string; day_date: string; started_at: string | null; ended_at: string | null }[]) {
    if (!byUser.has(d.user_id)) {
      byUser.set(d.user_id, { day_date: d.day_date, started_at: d.started_at, ended_at: d.ended_at });
    }
    if (byUser.size >= limit) break;
  }

  const { data: reports } = await supabase
    .from("worker_reports")
    .select("user_id, submitted_at")
    .eq("tenant_id", tenantId)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false });

  const lastReportByUser = new Map<string, string>();
  for (const r of (reports ?? []) as { user_id: string; submitted_at: string }[]) {
    if (!lastReportByUser.has(r.user_id)) lastReportByUser.set(r.user_id, r.submitted_at);
  }

  const result: WorkerListRow[] = [];
  Array.from(byUser.entries()).forEach(([user_id, day]) => {
    result.push({
      user_id,
      last_day_date: day.day_date,
      last_started_at: day.started_at,
      last_ended_at: day.ended_at,
      last_report_submitted_at: lastReportByUser.get(user_id) ?? null,
    });
  });
  return result;
}
