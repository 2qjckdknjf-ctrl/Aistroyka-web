/**
 * Safe bridge: legacy runtime tier (FREE/PRO/ENTERPRISE) → canonical plan code.
 * Transitional only; do not use for new product decisions. See docs/architecture/PLAN_BRIDGE_AND_ENTITLEMENT_RESOLUTION.md.
 */

import type { PlanCode } from "@aistroyka/contracts";
import type { LegacyTier, TierToPlanMappingResult } from "./bridge.types";

const TIER_TO_PLAN: Record<LegacyTier, PlanCode> = {
  FREE: "client_personal",
  PRO: "team_contractor",
  ENTERPRISE: "enterprise",
};

/**
 * Map legacy billing tier to canonical plan code.
 * Deterministic, explicit. FREE → client_personal (minimal tier = minimal plan);
 * PRO → team_contractor (mid tier = team execution); ENTERPRISE → enterprise.
 */
export function tierToPlanCode(tier: LegacyTier): PlanCode {
  return TIER_TO_PLAN[tier];
}

/**
 * Resolve legacy tier to canonical plan with metadata for context.
 */
export function mapLegacyTierToPlan(tier: LegacyTier): TierToPlanMappingResult {
  return {
    planCode: TIER_TO_PLAN[tier],
    source: "legacy_tier_bridge",
    legacyTier: tier,
  };
}

/** All legacy tiers in order (for iteration). */
export const LEGACY_TIERS: LegacyTier[] = ["FREE", "PRO", "ENTERPRISE"];
