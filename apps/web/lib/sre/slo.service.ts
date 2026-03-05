import type { SupabaseClient } from "@supabase/supabase-js";
import type { SloDailyRow } from "./slo.types";

export async function getSloOverview(
  supabase: SupabaseClient,
  tenantId: string,
  rangeDays: number
): Promise<SloDailyRow[]> {
  const start = new Date();
  start.setDate(start.getDate() - rangeDays);
  const startStr = start.toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("slo_daily")
    .select("tenant_id, date, endpoint_group, requests, errors, p95_latency_ms")
    .eq("tenant_id", tenantId)
    .gte("date", startStr)
    .order("date", { ascending: false })
    .limit(500);
  if (error) return [];
  return (data ?? []) as SloDailyRow[];
}
