/**
 * Add-on application rules: allowed per plan, limit deltas, capability grants.
 * Conservative: enterprise-grade add-ons (security_pack, sla_pack, integration_pack)
 * only for business_operations and enterprise.
 */

import type { AddOnCode, PlanCode } from "@aistroyka/contracts";
import type { EntitlementLimits } from "@aistroyka/contracts";
import type { PlanEntitlement, EntitlementCapabilities } from "./entitlements.types";
import type {
  AddOnLimitDelta,
  AddOnCapabilityGrants,
  AddOnApplicationResult,
  ApplyAddOnsResult,
} from "./add-on-rules.types";

/** Capacity add-ons: fixed deltas (added to plan base). */
const ADD_ON_LIMIT_DELTAS: Record<
  AddOnCode,
  AddOnLimitDelta | null
> = {
  extra_users: { maxUsers: 10 },
  extra_projects: { maxProjects: 5 },
  extra_storage: { maxStorageGb: 50 },
  ai_expansion: { maxMonthlyAiRequests: 2000 },
  premium_onboarding: null,
  premium_support: null,
  future_budget_cost: null,
  integration_pack: null,
  security_pack: null,
  sla_pack: null,
};

/** Capability add-ons: which flags they can set true. Only applied if plan allows the add-on. */
const ADD_ON_CAPABILITY_GRANTS: Record<AddOnCode, AddOnCapabilityGrants | null> = {
  extra_users: null,
  extra_projects: null,
  extra_storage: null,
  ai_expansion: null,
  premium_onboarding: { assistedOnboarding: true },
  premium_support: { prioritySupport: true },
  future_budget_cost: null,
  integration_pack: { integrations: true },
  security_pack: { auditLogs: true },
  sla_pack: { sla: true },
};

/** Add-ons that require business_operations or enterprise (not client_personal or team_contractor). */
const ENTERPRISE_GRADE_ADD_ONS: Set<AddOnCode> = new Set([
  "integration_pack",
  "security_pack",
  "sla_pack",
]);

/**
 * Whether an add-on is allowed for the given plan.
 * client_personal and team_contractor cannot get enterprise-grade add-ons.
 */
export function isAddOnAllowedForPlan(planCode: PlanCode, addOnCode: AddOnCode): boolean {
  if (!ENTERPRISE_GRADE_ADD_ONS.has(addOnCode)) return true;
  return planCode === "business_operations" || planCode === "enterprise";
}

/**
 * Apply a single add-on to base entitlements. Returns result with applied/skipped and deltas.
 */
export function applyAddOnToEntitlements(
  base: PlanEntitlement,
  planCode: PlanCode,
  addOnCode: AddOnCode
): AddOnApplicationResult {
  if (!isAddOnAllowedForPlan(planCode, addOnCode)) {
    return {
      applied: false,
      addOnCode,
      skippedReason: "not_allowed_for_plan",
    };
  }
  const limitDelta = ADD_ON_LIMIT_DELTAS[addOnCode];
  const capGrants = ADD_ON_CAPABILITY_GRANTS[addOnCode];
  if (!limitDelta && !capGrants) {
    return {
      applied: false,
      addOnCode,
      skippedReason: "no_effect",
    };
  }
  return {
    applied: true,
    addOnCode,
    limitsDelta: limitDelta ?? undefined,
    capabilitiesGranted: capGrants ?? undefined,
  };
}

/**
 * Apply all add-ons to base plan entitlements. Order-independent for limits; capabilities merged.
 * Skips disallowed add-ons and records warnings.
 */
export function applyAddOnsToEntitlements(
  baseEntitlements: PlanEntitlement,
  planCode: PlanCode,
  addOnCodes: AddOnCode[]
): ApplyAddOnsResult {
  const effectiveLimits: EntitlementLimits = { ...baseEntitlements.limits };
  const effectiveCapabilities: EntitlementCapabilities = { ...baseEntitlements.capabilities };
  const applied: AddOnCode[] = [];
  const skipped: AddOnApplicationResult[] = [];
  const warnings: string[] = [];

  for (const code of addOnCodes) {
    const result = applyAddOnToEntitlements(baseEntitlements, planCode, code);
    if (!result.applied) {
      skipped.push(result);
      if (result.skippedReason === "not_allowed_for_plan") {
        warnings.push(`Add-on ${code} not allowed for plan ${planCode}; skipped.`);
      }
      continue;
    }
    applied.push(code);
    if (result.limitsDelta) {
      if (result.limitsDelta.maxUsers != null) effectiveLimits.maxUsers += result.limitsDelta.maxUsers;
      if (result.limitsDelta.maxProjects != null) effectiveLimits.maxProjects += result.limitsDelta.maxProjects;
      if (result.limitsDelta.maxStorageGb != null) effectiveLimits.maxStorageGb += result.limitsDelta.maxStorageGb;
      if (result.limitsDelta.maxActiveMobileWorkers != null) effectiveLimits.maxActiveMobileWorkers += result.limitsDelta.maxActiveMobileWorkers;
      if (result.limitsDelta.maxMonthlyAiRequests != null) effectiveLimits.maxMonthlyAiRequests += result.limitsDelta.maxMonthlyAiRequests;
    }
    if (result.capabilitiesGranted) {
      if (result.capabilitiesGranted.assistedOnboarding === true) effectiveCapabilities.assistedOnboarding = true;
      if (result.capabilitiesGranted.prioritySupport === true) effectiveCapabilities.prioritySupport = true;
      if (result.capabilitiesGranted.integrations === true) effectiveCapabilities.integrations = true;
      if (result.capabilitiesGranted.auditLogs === true) effectiveCapabilities.auditLogs = true;
      if (result.capabilitiesGranted.sla === true) effectiveCapabilities.sla = true;
    }
  }

  return {
    effectiveLimits,
    effectiveCapabilities,
    appliedAddOns: applied,
    skipped,
    warnings,
  };
}
