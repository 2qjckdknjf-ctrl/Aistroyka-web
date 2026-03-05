import type { SupabaseClient } from "@supabase/supabase-js";
import { listFlags, getTenantOverrides } from "./flags.repository";
import type { ConfigPayload } from "./flags.types";

/** Stable hash for tenant_id for percentage rollout. */
function hashTenantForRollout(tenantId: string): number {
  let h = 0;
  for (let i = 0; i < tenantId.length; i++) {
    h = (h * 31 + tenantId.charCodeAt(i)) >>> 0;
  }
  return h % 100;
}

/**
 * Evaluate flags for a tenant: explicit tenant override > allowlist > percentage rollout > off.
 */
export async function evaluateFlags(
  supabase: SupabaseClient,
  tenantId: string | null
): Promise<Record<string, { enabled: boolean; variant?: string | null }>> {
  const [allFlags, overrides] = await Promise.all([
    listFlags(supabase),
    tenantId ? getTenantOverrides(supabase, tenantId) : Promise.resolve([]),
  ]);
  const overrideMap = new Map(overrides.map((o) => [o.key, o]));
  const result: Record<string, { enabled: boolean; variant?: string | null }> = {};
  for (const f of allFlags) {
    const override = overrideMap.get(f.key);
    if (override !== undefined) {
      result[f.key] = { enabled: override.enabled, variant: override.variant };
      continue;
    }
    if (tenantId && f.allowlist_tenant_ids?.includes(tenantId)) {
      result[f.key] = { enabled: true, variant: null };
      continue;
    }
    if (tenantId && f.rollout_percent != null && f.rollout_percent > 0) {
      const bucket = hashTenantForRollout(tenantId);
      result[f.key] = { enabled: bucket < f.rollout_percent, variant: null };
      continue;
    }
    result[f.key] = { enabled: false, variant: null };
  }
  return result;
}

/** Build config payload for GET /api/v1/config. */
export async function getConfigPayload(
  supabase: SupabaseClient,
  options: { tenantId: string | null; traceId: string; clientProfile: string }
): Promise<ConfigPayload> {
  const flags = await evaluateFlags(supabase, options.tenantId);
  return {
    flags,
    serverTime: new Date().toISOString(),
    traceId: options.traceId,
    clientProfile: options.clientProfile,
  };
}
