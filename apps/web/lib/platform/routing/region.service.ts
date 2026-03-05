import type { SupabaseClient } from "@supabase/supabase-js";
import type { RegionCode } from "./region.types";

const DEFAULT_REGION: RegionCode = "us";

/** Resolve region for tenant from tenant_data_plane; default "us" when not set. */
export async function getRegionForTenant(
  supabase: SupabaseClient,
  tenantId: string
): Promise<RegionCode> {
  const { data, error } = await supabase
    .from("tenant_data_plane")
    .select("region")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return DEFAULT_REGION;
  const r = (data as { region: string }).region;
  if (r === "eu" || r === "us" || r === "me" || r === "apac") return r as RegionCode;
  return DEFAULT_REGION;
}
