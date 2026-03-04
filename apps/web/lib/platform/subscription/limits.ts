import type { SubscriptionTier, TenantLimits } from "./subscription.types";

const LIMITS: Record<SubscriptionTier, TenantLimits> = {
  FREE: { tier: "FREE", monthly_ai_budget_usd: 5, per_minute_rate_limit_tenant: 10, per_minute_rate_limit_ip: 5, max_projects: 3, max_workers: 2, storage_limit_gb: 1 },
  PRO: { tier: "PRO", monthly_ai_budget_usd: 50, per_minute_rate_limit_tenant: 60, per_minute_rate_limit_ip: 20, max_projects: 20, max_workers: 15, storage_limit_gb: 10 },
  ENTERPRISE: { tier: "ENTERPRISE", monthly_ai_budget_usd: 500, per_minute_rate_limit_tenant: 300, per_minute_rate_limit_ip: 60, max_projects: 500, max_workers: 200, storage_limit_gb: 100 },
};

export function getLimitsForTier(tier: SubscriptionTier): TenantLimits {
  return { ...LIMITS[tier] };
}

export const DEFAULT_TIER: SubscriptionTier = "FREE";
