import type { SupabaseClient } from "@supabase/supabase-js";

type GateBillingRow = {
  status: string | null;
};

type GateEntitlementsRow = {
  tier: string | null;
};

const ACTIVE_BILLING_STATUSES = new Set(["active", "trialing"]);
const PAID_TIERS = new Set(["PRO", "ENTERPRISE"]);

async function resolveTenantIdForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: ownTenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (ownTenant?.id) return ownTenant.id as string;

  const { data: memberTenant } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  return (memberTenant?.tenant_id as string | undefined) ?? null;
}

export async function getActiveSubscriptionStateForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  tenantId: string | null;
  hasActiveSubscription: boolean;
  billingStatus: string | null;
  tier: string | null;
}> {
  const tenantId = await resolveTenantIdForUser(supabase, userId);
  if (!tenantId) {
    return {
      tenantId: null,
      hasActiveSubscription: false,
      billingStatus: null,
      tier: null,
    };
  }

  const [{ data: billing }, { data: entitlements }] = await Promise.all([
    supabase
      .from("billing_customers")
      .select("status")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    supabase.from("entitlements").select("tier").eq("tenant_id", tenantId).maybeSingle(),
  ]);

  const billingStatus = (billing as GateBillingRow | null)?.status?.toLowerCase() ?? null;
  const tier = (entitlements as GateEntitlementsRow | null)?.tier?.toUpperCase() ?? null;

  return {
    tenantId,
    hasActiveSubscription:
      (billingStatus != null && ACTIVE_BILLING_STATUSES.has(billingStatus)) ||
      (tier != null && PAID_TIERS.has(tier)),
    billingStatus,
    tier,
  };
}
