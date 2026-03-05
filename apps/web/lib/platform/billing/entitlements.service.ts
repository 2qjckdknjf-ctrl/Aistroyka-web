import type { SupabaseClient } from "@supabase/supabase-js";
import type { EntitlementsRow } from "./billing.types";
import { getLimitsForTier, DEFAULT_TIER } from "../subscription/limits";
import type { TenantLimits } from "../subscription/subscription.types";

/** Get entitlements row for tenant. Use service_role for webhook writes. */
export async function getEntitlements(
  supabase: SupabaseClient,
  tenantId: string
): Promise<EntitlementsRow | null> {
  const { data, error } = await supabase
    .from("entitlements")
    .select("tenant_id, tier, ai_budget_usd, max_projects, max_workers, storage_limit_gb, updated_at")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as EntitlementsRow;
}

/** Upsert entitlements (webhook / admin). */
export async function upsertEntitlements(
  supabase: SupabaseClient,
  row: {
    tenant_id: string;
    tier: string;
    ai_budget_usd?: number | null;
    max_projects?: number | null;
    max_workers?: number | null;
    storage_limit_gb?: number | null;
  }
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("entitlements").upsert(
    {
      tenant_id: row.tenant_id,
      tier: row.tier,
      ai_budget_usd: row.ai_budget_usd ?? null,
      max_projects: row.max_projects ?? null,
      max_workers: row.max_workers ?? null,
      storage_limit_gb: row.storage_limit_gb ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id" }
  );
  return { error: error?.message ?? null };
}

const VALID_TIERS = ["FREE", "PRO", "ENTERPRISE"] as const;
type Tier = (typeof VALID_TIERS)[number];

/** Resolve effective limits: entitlements row overrides tier defaults. */
export function limitsFromEntitlements(
  entitlements: EntitlementsRow | null,
  fallbackLimits: TenantLimits
): TenantLimits {
  if (!entitlements) return fallbackLimits;
  const t = (entitlements.tier ?? DEFAULT_TIER).toUpperCase();
  const tier: Tier = VALID_TIERS.includes(t as Tier) ? (t as Tier) : "FREE";
  const base = getLimitsForTier(tier);
  return {
    ...base,
    tier,
    monthly_ai_budget_usd: entitlements.ai_budget_usd != null ? Number(entitlements.ai_budget_usd) : base.monthly_ai_budget_usd,
    max_projects: entitlements.max_projects ?? base.max_projects,
    max_workers: entitlements.max_workers ?? base.max_workers,
    storage_limit_gb: entitlements.storage_limit_gb ?? base.storage_limit_gb,
  };
}
