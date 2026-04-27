/**
 * Effective entitlement resolution: base plan + add-ons + optional overrides.
 * Source of truth = canonical plan-fit model. Legacy tier only via bridge.
 */

import type { AddOnCode, PlanCode } from "@aistroyka/contracts";
import { getPlanEntitlements } from "./plans";
import type { PlanEntitlement } from "./entitlements.types";
import { applyAddOnsToEntitlements } from "./add-on-rules";
import type {
  ResolveEffectiveWorkspaceEntitlementsInput,
  ResolveEffectiveWorkspaceEntitlementsResult,
} from "./resolve.types";

/**
 * Resolve base plan entitlements (no add-ons). Canonical source.
 */
export function resolveBasePlanEntitlements(planCode: PlanCode): PlanEntitlement {
  return getPlanEntitlements(planCode);
}

/**
 * Resolve effective workspace entitlements: base plan + add-ons + optional overrides.
 * Pure: no DB, no billing. Legacy tier must be mapped to planCode via bridge before calling.
 */
export function resolveEffectiveWorkspaceEntitlements(
  input: ResolveEffectiveWorkspaceEntitlementsInput
): ResolveEffectiveWorkspaceEntitlementsResult {
  const { planCode, addOnCodes = [], overrides } = input;
  const base = resolveBasePlanEntitlements(planCode);
  const addOnResult = applyAddOnsToEntitlements(base, planCode, addOnCodes);

  let effectiveLimits = { ...addOnResult.effectiveLimits };
  let effectiveCapabilities = { ...addOnResult.effectiveCapabilities };

  if (overrides?.limits) {
    effectiveLimits = { ...effectiveLimits, ...overrides.limits };
  }
  if (overrides?.capabilities) {
    effectiveCapabilities = { ...effectiveCapabilities, ...overrides.capabilities };
  }

  return {
    sourcePlanCode: planCode,
    appliedAddOnCodes: addOnResult.appliedAddOns,
    effectiveLimits,
    effectiveCapabilities,
    warnings: addOnResult.warnings,
    meta: {
      hadOverrides: Boolean(overrides && (Object.keys(overrides.limits ?? {}).length > 0 || Object.keys(overrides.capabilities ?? {}).length > 0)),
    },
  };
}
