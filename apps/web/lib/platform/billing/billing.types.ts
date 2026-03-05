/**
 * Billing and entitlements types.
 */

export interface BillingCustomerRow {
  tenant_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: string | null;
  status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
}

export interface EntitlementsRow {
  tenant_id: string;
  tier: string;
  ai_budget_usd: number | null;
  max_projects: number | null;
  max_workers: number | null;
  storage_limit_gb: number | null;
  updated_at: string;
}

export type SubscriptionTier = "FREE" | "PRO" | "ENTERPRISE";
