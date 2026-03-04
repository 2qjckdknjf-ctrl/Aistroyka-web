import type { SupabaseClient } from "@supabase/supabase-js";

export interface MetricsOverviewRow {
  tenant_id: string;
  date: string;
  ai_calls: number;
  ai_cost_usd: number;
  jobs_processed: number;
  jobs_failed: number;
  uploads: number;
  active_workers: number;
}

/** Get tenant_daily_metrics for the last N days for a tenant. */
export async function getMetricsOverview(
  supabase: SupabaseClient,
  tenantId: string,
  rangeDays: number
): Promise<MetricsOverviewRow[]> {
  const start = new Date();
  start.setDate(start.getDate() - rangeDays);
  const startStr = start.toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("tenant_daily_metrics")
    .select("tenant_id, date, ai_calls, ai_cost_usd, jobs_processed, jobs_failed, uploads, active_workers")
    .eq("tenant_id", tenantId)
    .gte("date", startStr)
    .order("date", { ascending: false });
  if (error) return [];
  return (data ?? []) as MetricsOverviewRow[];
}

/** Get tenant_daily_metrics for multiple tenants (e.g. org overview). Caller must ensure authz (org_admin). */
export async function getMetricsOverviewForTenantIds(
  supabase: SupabaseClient,
  tenantIds: string[],
  rangeDays: number
): Promise<MetricsOverviewRow[]> {
  if (tenantIds.length === 0) return [];
  const start = new Date();
  start.setDate(start.getDate() - rangeDays);
  const startStr = start.toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("tenant_daily_metrics")
    .select("tenant_id, date, ai_calls, ai_cost_usd, jobs_processed, jobs_failed, uploads, active_workers")
    .in("tenant_id", tenantIds)
    .gte("date", startStr)
    .order("date", { ascending: false });
  if (error) return [];
  return (data ?? []) as MetricsOverviewRow[];
}

/** Get AI usage from ai_usage table for tenant and date range (fallback when tenant_daily_metrics not populated). */
export async function getAiUsageFromLogs(
  supabase: SupabaseClient,
  tenantId: string,
  rangeDays: number
): Promise<{ date: string; calls: number; cost_usd: number }[]> {
  const start = new Date();
  start.setDate(start.getDate() - rangeDays);
  const startStr = start.toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("ai_usage")
    .select("created_at, cost_usd")
    .eq("tenant_id", tenantId)
    .gte("created_at", startStr);
  if (error) return [];
  const byDate: Record<string, { calls: number; cost_usd: number }> = {};
  for (const row of (data ?? []) as { created_at: string; cost_usd: number }[]) {
    const d = row.created_at.slice(0, 10);
    if (!byDate[d]) byDate[d] = { calls: 0, cost_usd: 0 };
    byDate[d].calls += 1;
    byDate[d].cost_usd += Number(row.cost_usd ?? 0);
  }
  return Object.entries(byDate).map(([date, v]) => ({ date, calls: v.calls, cost_usd: v.cost_usd }));
}

/** Get failed jobs for tenant (optional status filter). */
export async function getFailedJobs(
  supabase: SupabaseClient,
  tenantId: string,
  limit: number = 50
): Promise<{ id: string; type: string; status: string; last_error: string; created_at: string }[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("id, type, status, last_error, created_at")
    .eq("tenant_id", tenantId)
    .in("status", ["failed", "dead"])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as { id: string; type: string; status: string; last_error: string; created_at: string }[];
}
