/**
 * Input/output types for effective entitlement resolution.
 */

import type { AddOnCode, PlanCode } from "@aistroyka/contracts";
import type { PlanEntitlement } from "./entitlements.types";
import type { UsageSnapshot } from "./capability.types";

export interface ResolveEffectiveWorkspaceEntitlementsInput {
  /** Canonical plan code (use bridge first if source is legacy tier). */
  planCode: PlanCode;
  addOnCodes?: AddOnCode[];
  usage?: UsageSnapshot;
  /** Optional overrides: partial limits/caps (e.g. admin override). Applied last. */
  overrides?: {
    limits?: Partial<PlanEntitlement["limits"]>;
    capabilities?: Partial<PlanEntitlement["capabilities"]>;
  };
}

export interface ResolveEffectiveWorkspaceEntitlementsResult {
  sourcePlanCode: PlanCode;
  appliedAddOnCodes: AddOnCode[];
  effectiveLimits: PlanEntitlement["limits"];
  effectiveCapabilities: PlanEntitlement["capabilities"];
  warnings: string[];
  /** For debugging / audit. */
  meta?: {
    hadOverrides: boolean;
  };
}
