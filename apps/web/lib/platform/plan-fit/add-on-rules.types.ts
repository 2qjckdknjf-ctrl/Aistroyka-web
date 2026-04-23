/**
 * Add-on application rules: what each add-on changes and which plans can use it.
 */

import type { AddOnCode, PlanCode } from "@aistroyka/contracts";
import type { EntitlementLimits } from "@aistroyka/contracts";
import type { EntitlementCapabilities } from "./entitlements.types";

/** Fixed limit deltas for capacity add-ons (applied on top of plan base). */
export interface AddOnLimitDelta {
  maxUsers?: number;
  maxProjects?: number;
  maxStorageGb?: number;
  maxActiveMobileWorkers?: number;
  maxMonthlyAiRequests?: number;
}

/** Capability flags that an add-on can set to true (only these may be turned on by add-on). */
export interface AddOnCapabilityGrants {
  assistedOnboarding?: boolean;
  prioritySupport?: boolean;
  integrations?: boolean;
  auditLogs?: boolean;
  sla?: boolean;
}

/** Result of applying one add-on (for tests and meta). */
export interface AddOnApplicationResult {
  applied: boolean;
  addOnCode: AddOnCode;
  skippedReason?: "not_allowed_for_plan" | "no_effect";
  limitsDelta?: Partial<EntitlementLimits>;
  capabilitiesGranted?: Partial<EntitlementCapabilities>;
}

/** Result of applying all add-ons. */
export interface ApplyAddOnsResult {
  effectiveLimits: EntitlementLimits;
  effectiveCapabilities: EntitlementCapabilities;
  appliedAddOns: AddOnCode[];
  skipped: AddOnApplicationResult[];
  warnings: string[];
}
