/**
 * Analytics read: productivity, ai-risk, ops. Reads from events and slo_daily.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export async function getProductivity(
  supabase: SupabaseClient,
  tenantId: string,
  rangeDays: number,
  _projectId?: string | null
): Promise<{ date: string; reports_submitted: number; media_uploaded: number; tasks_completed: number }[]> {
  const start = new Date();
  start.setDate(start.getDate() - rangeDays);
  const startStr = start.toISOString().slice(0, 10);
  const { data } = await supabase
    .from("events")
    .select("event, ts")
    .eq("tenant_id", tenantId)
    .gte("ts", startStr);
  const rows = (data ?? []) as { event: string; ts: string }[];
  const byDate = new Map<string, { reports_submitted: number; media_uploaded: number; tasks_completed: number }>();
  for (const r of rows) {
    const date = r.ts.slice(0, 10);
    if (!byDate.has(date)) byDate.set(date, { date, reports_submitted: 0, media_uploaded: 0, tasks_completed: 0 });
    const row = byDate.get(date)!;
    if (r.event === "report_submit") row.reports_submitted++;
    else if (r.event === "media_finalize") row.media_uploaded++;
    else if (r.event === "task_assign") row.tasks_completed++;
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getAiRisk(
  supabase: SupabaseClient,
  tenantId: string,
  rangeDays: number
): Promise<{ report_id: string; risk_score: string; reasons: string[] }[]> {
  const start = new Date();
  start.setDate(start.getDate() - rangeDays);
  const { data } = await supabase
    .from("events")
    .select("props")
    .eq("tenant_id", tenantId)
    .eq("event", "ai_usage")
    .gte("ts", start.toISOString());
  const rows = (data ?? []) as { props: { report_id?: string; risk_level?: string; reasons?: string[] } }[];
  return rows
    .filter((r) => r.props?.report_id)
    .map((r) => ({
      report_id: r.props.report_id as string,
      risk_score: (r.props.risk_level as string) ?? "medium",
      reasons: (r.props.reasons as string[]) ?? [],
    }));
}

export async function getOpsKpis(
  supabase: SupabaseClient,
  tenantId: string,
  rangeDays: number
): Promise<{ date: string; jobs_fail_rate: number; p95_sync_latency_ms: number | null; ai_cost_usd: number }[]> {
  const { data } = await supabase
    .from("slo_daily")
    .select("date, endpoint_group, requests, errors, p95_latency_ms")
    .eq("tenant_id", tenantId)
    .gte("date", new Date(Date.now() - rangeDays * 86400000).toISOString().slice(0, 10));
  const rows = (data ?? []) as { date: string; endpoint_group: string; requests: number; errors: number; p95_latency_ms: number | null }[];
  const byDate = new Map<string, { jobs_requests: number; jobs_errors: number; sync_latency: number | null; ai_cost: number }>();
  for (const r of rows) {
    if (!byDate.has(r.date)) byDate.set(r.date, { jobs_requests: 0, jobs_errors: 0, sync_latency: null, ai_cost: 0 });
    const row = byDate.get(r.date)!;
    if (r.endpoint_group === "jobs") {
      row.jobs_requests += r.requests;
      row.jobs_errors += r.errors;
    } else if (r.endpoint_group === "sync") row.sync_latency = r.p95_latency_ms;
  }
  return Array.from(byDate.entries()).map(([date, v]) => ({
    date,
    jobs_fail_rate: v.jobs_requests ? v.jobs_errors / v.jobs_requests : 0,
    p95_sync_latency_ms: v.sync_latency,
    ai_cost_usd: v.ai_cost,
  }));
}
