/**
 * Contextual upgrade prompt types.
 * Step 11: feature-unavailable surfaces, non-blocking.
 */

import type { PlanCode } from "@aistroyka/contracts";

export type UpgradePromptVariant =
  | "feature_unavailable"
  | "feature_limited"
  | "explore_higher_plan"
  | "enterprise_contact"
  | "informational_only";

export type CapabilityKeyForPrompt =
  | "advancedApprovals"
  | "advancedDocuments"
  | "portfolioAnalytics"
  | "managerAi"
  | "integrations"
  | "sso"
  | "auditLogs"
  | "apiAccess";

export interface UpgradePromptViewModel {
  capabilityKey: CapabilityKeyForPrompt;
  currentPlanCode: PlanCode;
  currentPlanName: string;
  requiredPlanCode: PlanCode | null;
  requiredPlanName: string | null;
  promptVariant: UpgradePromptVariant;
  title: string;
  description: string;
  ctaLabel: string;
  ctaTargetRoute: string;
  learnMoreLabel: string | null;
  severity: "info" | "soft" | "neutral";
  showPrompt: boolean;
  isLegacyBridge: boolean;
}
