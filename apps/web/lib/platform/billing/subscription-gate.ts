import type { SupabaseClient } from "@supabase/supabase-js";
import { getWorkspacePilotStatus } from "@/lib/platform/billing-readiness/billing-pilot.repository";

/**
 * Controls server-side dashboard subscription enforcement in `(dashboard)` layout.
 * - Default / unset / `enforce`: redirect to `/subscribe` when tenant exists but billing is inactive (production behavior).
 * - `off`, `pilot`, or `bypass`: skip that redirect (staging/pilot; set explicitly in Workers env).
 *
 * Even when enforced, workspaces in the billing pilot cohort (`billing_pilot_workspaces` table or
 * `BILLING_PILOT_WORKSPACE_IDS` env) are treated as **dashboard-eligible**: same UX as paying/trialing
 * billing so pilots do not see a “vanished cabinet”. Active Stripe states `active`/`trialing` still count as subscribed.
 *
 * Never enable bypass in production tenant-facing deploys unless intentionally relaxing billing for pilots.
 */
export function isDashboardSubscriptionGateEnforced(): boolean {
  const v = process.env.SUBSCRIPTION_GATE_DASHBOARD?.trim().toLowerCase();
  if (!v || v === "enforce" || v === "on") return true;
  if (v === "off" || v === "pilot" || v === "bypass") return false;
  return true;
}

type GateBillingRow = {
  status: string | null;
};

type GateEntitlementsRow = {
  tier: string | null;
};

const ACTIVE_BILLING_STATUSES = new Set(["active", "trialing"]);
const PAID_TIERS = new Set(["PRO", "ENTERPRISE"]);

/** Paid/trial billing OR billing-pilot workspace. Exported for tests. */
export function dashboardAccessFromBillingAndPilot(
  hasActiveSubscription: boolean,
  inBillingPilotCohort: boolean
): boolean {
  return hasActiveSubscription || inBillingPilotCohort;
}

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
  /** Billing pilot cohort / env allowlist: dashboard allowed without paid subscription. */
  inBillingPilotCohort: boolean;
  /** Consolidated gate: subscription, trialing, paid tier, or pilot workspace. */
  hasDashboardAccess: boolean;
  billingStatus: string | null;
  tier: string | null;
}> {
  const tenantId = await resolveTenantIdForUser(supabase, userId);
  if (!tenantId) {
    return {
      tenantId: null,
      hasActiveSubscription: false,
      inBillingPilotCohort: false,
      hasDashboardAccess: false,
      billingStatus: null,
      tier: null,
    };
  }

  const [{ data: billing }, { data: entitlements }, pilot] = await Promise.all([
    supabase
      .from("billing_customers")
      .select("status")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    supabase.from("entitlements").select("tier").eq("tenant_id", tenantId).maybeSingle(),
    getWorkspacePilotStatus(supabase, tenantId),
  ]);

  const billingStatus = (billing as GateBillingRow | null)?.status?.toLowerCase() ?? null;
  const tier = (entitlements as GateEntitlementsRow | null)?.tier?.toUpperCase() ?? null;

  const hasActiveSubscription =
    (billingStatus != null && ACTIVE_BILLING_STATUSES.has(billingStatus)) ||
    (tier != null && PAID_TIERS.has(tier));
  const inBillingPilotCohort = pilot.inCohort;

  return {
    tenantId,
    hasActiveSubscription,
    inBillingPilotCohort,
    hasDashboardAccess: dashboardAccessFromBillingAndPilot(hasActiveSubscription, inBillingPilotCohort),
    billingStatus,
    tier,
  };
}
