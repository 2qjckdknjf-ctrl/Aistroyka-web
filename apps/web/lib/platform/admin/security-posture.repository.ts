import type { SupabaseClient } from "@supabase/supabase-js";

export interface SecurityPostureData {
  debug_enabled_in_prod: boolean;
  retention_policy_days: number | null;
  sso_enabled: boolean;
  critical_alerts_last_30d: number;
}

export async function getSecurityPosture(
  supabase: SupabaseClient,
  tenantId: string
): Promise<SecurityPostureData> {
  const start = new Date();
  start.setDate(start.getDate() - 30);

  const [alertsRes, idpRes, retentionRes] = await Promise.all([
    supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("severity", "critical")
      .gte("created_at", start.toISOString()),
    supabase
      .from("identity_providers")
      .select("tenant_id")
      .eq("tenant_id", tenantId)
      .eq("enabled", true)
      .maybeSingle(),
    supabase
      .from("data_retention_policies")
      .select("media_retention_days")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
  ]);

  return {
    debug_enabled_in_prod: false, // Will be set by service
    retention_policy_days: (retentionRes.data as { media_retention_days?: number } | null)?.media_retention_days ?? null,
    sso_enabled: Boolean(idpRes.data),
    critical_alerts_last_30d: alertsRes.count ?? 0,
  };
}
