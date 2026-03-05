import type { SupabaseClient } from "@supabase/supabase-js";

export async function getBaseline(
  supabase: SupabaseClient,
  tenantId: string,
  metric: string,
  date: Date
): Promise<number | null> {
  const dateStr = date.toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("baselines_daily")
    .select("value")
    .eq("tenant_id", tenantId)
    .eq("metric", metric)
    .eq("date", dateStr)
    .maybeSingle();
  if (error || !data) return null;
  return Number((data as { value: number }).value);
}

export async function setBaseline(
  supabase: SupabaseClient,
  tenantId: string,
  metric: string,
  date: Date,
  value: number
): Promise<void> {
  const dateStr = date.toISOString().slice(0, 10);
  await supabase.from("baselines_daily").upsert(
    { tenant_id: tenantId, metric, date: dateStr, value },
    { onConflict: "tenant_id,metric,date" }
  );
}
