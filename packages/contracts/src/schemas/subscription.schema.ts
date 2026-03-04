import { z } from "zod";

export const SubscriptionTierSchema = z.enum(["FREE", "PRO", "ENTERPRISE"]);

export const TenantLimitsSchema = z.object({
  tier: SubscriptionTierSchema,
  monthly_ai_budget_usd: z.number(),
  per_minute_rate_limit_tenant: z.number(),
  per_minute_rate_limit_ip: z.number(),
  max_projects: z.number(),
  max_workers: z.number(),
  storage_limit_gb: z.number(),
});

export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;
export type TenantLimits = z.infer<typeof TenantLimitsSchema>;
