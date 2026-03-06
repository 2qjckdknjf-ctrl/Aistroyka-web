import type { SupabaseClient } from "@supabase/supabase-js";

const OVERTIME_HOURS = 8;
const NO_ACTIVITY_DAYS = 7;

export interface WorkerListRow {
  user_id: string;
  last_day_date: string | null;
  last_started_at: string | null;
  last_ended_at: string | null;
  last_report_submitted_at: string | null;
  anomalies: {
    open_shift: boolean;
    overtime: boolean;
    no_activity: boolean;
  };
}

/**
 * List workers (distinct user_ids) with last day, last report, and anomaly flags (tenant-scoped).
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

  const [reportsRes, openShiftRes] = await Promise.all([
    supabase
      .from("worker_reports")
      .select("user_id, submitted_at")
      .eq("tenant_id", tenantId)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("worker_day")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .not("started_at", "is", null)
      .is("ended_at", null)
      .gte("day_date", new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)),
  ]);

  const lastReportByUser = new Map<string, string>();
  for (const r of (reportsRes.data ?? []) as { user_id: string; submitted_at: string }[]) {
    if (!lastReportByUser.has(r.user_id)) lastReportByUser.set(r.user_id, r.submitted_at);
  }
  const openShiftUsers = new Set((openShiftRes.data ?? []).map((x) => (x as { user_id: string }).user_id));

  const noActivityCutoff = new Date(Date.now() - NO_ACTIVITY_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const overtimeMs = OVERTIME_HOURS * 60 * 60 * 1000;

  const result: WorkerListRow[] = [];
  Array.from(byUser.entries()).forEach(([user_id, day]) => {
    const lastReport = lastReportByUser.get(user_id) ?? null;
    const open_shift = openShiftUsers.has(user_id);
    let overtime = false;
    if (day.started_at && day.ended_at) {
      const start = new Date(day.started_at).getTime();
      const end = new Date(day.ended_at).getTime();
      if (end > start && end - start > overtimeMs) overtime = true;
    }
    const no_activity = !!(
      (lastReport === null && byUser.has(user_id)) ||
      (lastReport !== null && lastReport < noActivityCutoff)
    );
    result.push({
      user_id,
      last_day_date: day.day_date,
      last_started_at: day.started_at,
      last_ended_at: day.ended_at,
      last_report_submitted_at: lastReport,
      anomalies: { open_shift, overtime, no_activity },
    });
  });
  return result;
}
