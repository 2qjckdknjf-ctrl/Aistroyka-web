import type { SubscriptionTierKey } from "./policy.types";

export function getModelForTier(tier: SubscriptionTierKey): { primary: string; fallback?: string } {
  if (tier === "ENTERPRISE") return { primary: "gpt-4o", fallback: "gpt-4o-mini" };
  if (tier === "PRO") return { primary: "gpt-4o-mini", fallback: "gpt-3.5-turbo" };
  return { primary: "gpt-4o-mini" };
}
