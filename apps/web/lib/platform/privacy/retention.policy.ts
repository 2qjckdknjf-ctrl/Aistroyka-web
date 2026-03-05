import type { SupabaseClient } from "@supabase/supabase-js";

/** Resolve media retention days for tenant from data_retention_policies. */
export async function getMediaRetentionDays(
  supabase: SupabaseClient,
  tenantId: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from("data_retention_policies")
    .select("media_retention_days")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { media_retention_days?: number }).media_retention_days ?? null;
}
