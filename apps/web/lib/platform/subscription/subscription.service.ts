import type { SupabaseClient } from "@supabase/supabase-js";
import { getLimitsForTier, DEFAULT_TIER } from "./limits";
import type { SubscriptionTier, TenantLimits } from "./subscription.types";

/** Resolve tenant tier from DB (tenants.plan or subscription table); default FREE. */
export async function getTierForTenant(
  supabase: SupabaseClient,
  tenantId: string
): Promise<SubscriptionTier> {
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

/** Get full limits for a tenant. Resolves tier then returns limits. */
export async function getLimitsForTenant(
  supabase: SupabaseClient,
  tenantId: string
): Promise<TenantLimits> {
  const tier = await getTierForTenant(supabase, tenantId);
  return getLimitsForTier(tier);
}
