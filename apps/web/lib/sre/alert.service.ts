import type { SupabaseClient } from "@supabase/supabase-js";

export type AlertSeverity = "info" | "warn" | "critical";
export type AlertType = "slo_breach" | "quota_spike" | "job_fail_spike";

export async function createAlert(
  supabase: SupabaseClient,
  params: { tenant_id?: string | null; severity: AlertSeverity; type: AlertType; message: string }
): Promise<void> {
  try {
    await supabase.from("alerts").insert({
      tenant_id: params.tenant_id ?? null,
      severity: params.severity,
      type: params.type,
      message: params.message,
    });
  } catch {
    /* best-effort */
  }
}

export async function listAlerts(
  supabase: SupabaseClient,
  options: { tenantId?: string | null; unresolvedOnly?: boolean; limit?: number }
): Promise<{ id: string; tenant_id: string | null; severity: string; type: string; message: string; created_at: string; resolved_at: string | null }[]> {
  let q = supabase.from("alerts").select("id, tenant_id, severity, type, message, created_at, resolved_at").order("created_at", { ascending: false }).limit(options.limit ?? 50);
  if (options.tenantId) q = q.eq("tenant_id", options.tenantId);
  if (options.unresolvedOnly) q = q.is("resolved_at", null);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as { id: string; tenant_id: string | null; severity: string; type: string; message: string; created_at: string; resolved_at: string | null }[];
}
