import type { SupabaseClient } from "@supabase/supabase-js";
import type { SloDailyRow } from "./slo.types";

/** Get SLO daily rows for tenant(s) in range. */
export async function getSloDaily(
  supabase: SupabaseClient,
  options: { tenantId?: string | null; rangeDays: number }
): Promise<SloDailyRow[]> {
  const start = new Date();
  start.setDate(start.getDate() - options.rangeDays);
  const startStr = start.toISOString().slice(0, 10);
  let q = supabase
    .from("slo_daily")
    .select("tenant_id, date, endpoint_group, requests, errors, p95_latency_ms")
    .gte("date", startStr)
    .order("date", { ascending: false });
  if (options.tenantId) q = q.eq("tenant_id", options.tenantId);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as SloDailyRow[];
}
