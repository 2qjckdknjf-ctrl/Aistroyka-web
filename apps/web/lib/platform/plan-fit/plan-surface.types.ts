/**
 * Plan surface types for UI display.
 * Step 10: trial / upgrade surface without checkout.
 */

import type { PlanCode } from "@aistroyka/contracts";
import type { EntitlementLimits } from "@aistroyka/contracts";
import type { EntitlementCapabilities } from "./entitlements.types";

export interface PlanLimitsSummary {
  maxUsers: number;
  maxProjects: number;
  maxStorageGb: number;
  maxActiveMobileWorkers: number;
  maxMonthlyAiRequests: number;
}

export interface CapabilityGroupSummary {
  key: string;
  label: string;
  items: { key: string; label: string; enabled: boolean }[];
}

export interface PlanDisplayCopy {
  name: string;
  descriptionShort: string;
  featureBullets: string[];
}

export type UpgradeCtaVariant =
  | "explore_plans"
  | "see_business_options"
  | "contact_enterprise"
  | "managed_plan"
  | "none";

export interface UpgradeSuggestion {
  suggestedPlanCode: PlanCode | null;
  ctaVariant: UpgradeCtaVariant;
  ctaCopy: string;
  learnMoreCopy: string;
}

export interface PlanSurfaceViewModel {
  currentPlanCode: PlanCode;
  humanReadablePlanName: string;
  sourceKind: "canonical_plan" | "legacy_tier_bridge" | "override";
  sourceLabel: string;
  planDescriptionShort: string;
  limitsSummary: PlanLimitsSummary;
  capabilityGroups: CapabilityGroupSummary[];
  upgradeSuggestion: UpgradeSuggestion;
  isEnterprise: boolean;
  isLegacyBridge: boolean;
}
