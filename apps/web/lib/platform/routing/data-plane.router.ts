import type { SupabaseClient } from "@supabase/supabase-js";
import { getRegionForTenant } from "./region.service";
import { getShardForTenant } from "./shard.service";
import type { DataPlaneResult } from "./region.types";

/** Connection hint for "default" = use current Supabase. Future: return project key for multi-DB. */
const DEFAULT_CONNECTION_HINT = "default";

/**
 * Resolve data plane for tenant. All repository factories should use this to resolve
 * which connection/shard to use. For now only one data plane exists; returns default.
 * When adding another Supabase project: map shard to client and return connectionHint.
 */
export async function getDataPlane(
  supabase: SupabaseClient,
  tenantId: string
): Promise<DataPlaneResult> {
  const [region, shard] = await Promise.all([
    getRegionForTenant(supabase, tenantId),
    getShardForTenant(supabase, tenantId),
  ]);
  return {
    region,
    shard,
    connectionHint: DEFAULT_CONNECTION_HINT,
  };
}
