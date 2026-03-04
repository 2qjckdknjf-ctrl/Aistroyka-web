export type SubscriptionTier = "FREE" | "PRO" | "ENTERPRISE";

export interface TenantLimits {
  tier: SubscriptionTier;
  monthly_ai_budget_usd: number;
  per_minute_rate_limit_tenant: number;
  per_minute_rate_limit_ip: number;
  max_projects: number;
  max_workers: number;
  storage_limit_gb: number;
}
