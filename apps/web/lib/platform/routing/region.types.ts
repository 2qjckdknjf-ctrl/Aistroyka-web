/**
 * Multi-region and sharding types. Region is metadata; shard identifies data plane.
 */

export type RegionCode = "eu" | "us" | "me" | "apac";

export interface TenantDataPlaneRow {
  tenant_id: string;
  region: RegionCode;
  shard: string;
  created_at: string;
}

export interface DataPlaneResult {
  region: RegionCode;
  shard: string;
  /** Hint for connection resolution: "default" = current Supabase; future: project key. */
  connectionHint: string;
}
