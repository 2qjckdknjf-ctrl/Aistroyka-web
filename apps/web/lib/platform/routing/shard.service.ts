import type { SupabaseClient } from "@supabase/supabase-js";

/** Default shard label when tenant has no row (single data plane). */
export const DEFAULT_SHARD = "default";

/** Resolve shard for tenant from tenant_data_plane; default "default" when not set. */
export async function getShardForTenant(
  supabase: SupabaseClient,
  tenantId: string
): Promise<string> {
  const { data, error } = await supabase
    .from("tenant_data_plane")
    .select("shard")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return DEFAULT_SHARD;
  return (data as { shard: string }).shard || DEFAULT_SHARD;
}
