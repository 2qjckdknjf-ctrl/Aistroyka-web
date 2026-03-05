import type { SupabaseClient } from "@supabase/supabase-js";
import { getLimitsForTier, DEFAULT_TIER } from "./limits";
import type { SubscriptionTier, TenantLimits } from "./subscription.types";
import { getEntitlements, limitsFromEntitlements } from "../billing/entitlements.service";

/** Resolve tenant tier: entitlements (source of truth) then tenants.plan; default FREE. */
export async function getTierForTenant(
  supabase: SupabaseClient,
  tenantId: string
): Promise<SubscriptionTier> {
  const entitlements = await getEntitlements(supabase, tenantId);
  if (entitlements?.tier) {
    const t = entitlements.tier.toUpperCase();
    if (t === "PRO" || t === "ENTERPRISE") return t as SubscriptionTier;
    return "FREE";
  }
  const { data, error } = await supabase
    .from("tenants")
    .select("plan")
    .eq("id", tenantId)
    .maybeSingle();
  if (error || !data?.plan) return DEFAULT_TIER;
  const plan = String(data.plan).toUpperCase();
  if (plan === "PRO" || plan === "ENTERPRISE") return plan as SubscriptionTier;
  return DEFAULT_TIER;
}

/** Get full limits for a tenant. Entitlements override tier defaults. */
export async function getLimitsForTenant(
  supabase: SupabaseClient,
  tenantId: string
): Promise<TenantLimits> {
  const entitlements = await getEntitlements(supabase, tenantId);
  const tier = await getTierForTenant(supabase, tenantId);
  const fallback = getLimitsForTier(tier);
  return limitsFromEntitlements(entitlements, fallback);
}
