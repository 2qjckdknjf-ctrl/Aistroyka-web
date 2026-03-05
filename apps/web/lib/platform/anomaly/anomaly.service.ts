import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnomalyResult } from "./anomaly.types";
import { emitAudit } from "@/lib/observability/audit.service";

export async function recordAnomaly(
  supabase: SupabaseClient,
  tenantId: string,
  result: AnomalyResult
): Promise<string | null> {
  const { data, error } = await supabase
    .from("anomalies")
    .insert({
      tenant_id: tenantId,
      severity: result.severity,
      type: result.type,
      metric: result.metric,
      observed: result.observed,
      expected: result.expected,
      details: result.details ?? {},
    })
    .select("id")
    .single();
  if (error || !data) return null;
  await emitAudit(supabase, {
    tenant_id: tenantId,
    action: "anomaly_detected",
    resource_type: "anomaly",
    resource_id: (data as { id: string }).id,
    details: { type: result.type, severity: result.severity },
  });
  return (data as { id: string }).id;
}

export async function listAnomalies(
  supabase: SupabaseClient,
  tenantId: string,
  rangeDays: number,
  resolved?: boolean
): Promise<{ id: string; severity: string; type: string; metric: string; observed: number; expected: number; details: unknown; created_at: string; resolved_at: string | null }[]> {
  const start = new Date();
  start.setDate(start.getDate() - rangeDays);
  let q = supabase
    .from("anomalies")
    .select("id, severity, type, metric, observed, expected, details, created_at, resolved_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", start.toISOString())
    .order("created_at", { ascending: false })
    .limit(200);
  if (resolved === false) q = q.is("resolved_at", null);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as { id: string; severity: string; type: string; metric: string; observed: number; expected: number; details: unknown; created_at: string; resolved_at: string | null }[];
}
