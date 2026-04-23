/**
 * Types for legacy tier → canonical plan bridge.
 * Transitional mapping only; not the final business model.
 */

import type { PlanCode } from "@aistroyka/contracts";

/** Legacy runtime billing tier (FREE/PRO/ENTERPRISE). Source of mapping input. */
export type LegacyTier = "FREE" | "PRO" | "ENTERPRISE";

/** Result of mapping a legacy tier to canonical plan. */
export interface TierToPlanMappingResult {
  planCode: PlanCode;
  source: "legacy_tier_bridge";
  legacyTier: LegacyTier;
}
