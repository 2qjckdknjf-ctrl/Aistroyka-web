/**
 * Capability -> upgrade prompt mapping.
 * Step 11: which capabilities get prompts, suggested plan, copy.
 */

import type { PlanCode } from "@aistroyka/contracts";
import type { CapabilityKeyForPrompt, UpgradePromptVariant } from "./upgrade-prompt.types";
import { PLAN_DISPLAY_COPY } from "./plan-surface-copy";

/** Plan order for comparison. */
const PLAN_ORDER: PlanCode[] = ["client_personal", "team_contractor", "business_operations", "enterprise"];

function planLevel(plan: PlanCode): number {
  const i = PLAN_ORDER.indexOf(plan);
  return i >= 0 ? i : -1;
}

export interface CapabilityPromptConfig {
  capabilityKey: CapabilityKeyForPrompt;
  label: string;
  requiredPlanCode: PlanCode;
  title: string;
  description: string;
  ctaLabel: string;
  learnMoreLabel: string | null;
  promptVariant: UpgradePromptVariant;
}

export const CAPABILITY_PROMPT_CONFIG: Record<CapabilityKeyForPrompt, CapabilityPromptConfig> = {
  advancedApprovals: {
    capabilityKey: "advancedApprovals",
    label: "Advanced approvals",
    requiredPlanCode: "business_operations",
    title: "Advanced approvals",
    description: "Approval chains, custom roles, and advanced workflow are available on Business Operations.",
    ctaLabel: "Explore Business Operations",
    learnMoreLabel: "Approval chains and custom roles",
    promptVariant: "explore_higher_plan",
  },
  advancedDocuments: {
    capabilityKey: "advancedDocuments",
    label: "Advanced documents",
    requiredPlanCode: "business_operations",
    title: "Advanced documents",
    description: "Advanced document management and formal records are available on Business Operations.",
    ctaLabel: "Explore Business Operations",
    learnMoreLabel: "Formal records and advanced docs",
    promptVariant: "explore_higher_plan",
  },
  portfolioAnalytics: {
    capabilityKey: "portfolioAnalytics",
    label: "Portfolio analytics",
    requiredPlanCode: "business_operations",
    title: "Portfolio command view",
    description: "Health, risk, and recommended actions across your portfolio are available on Business Operations.",
    ctaLabel: "Explore Business Operations",
    learnMoreLabel: "Portfolio health and risk signals",
    promptVariant: "explore_higher_plan",
  },
  managerAi: {
    capabilityKey: "managerAi",
    label: "Manager AI",
    requiredPlanCode: "team_contractor",
    title: "Manager AI",
    description: "AI insights and recommendations are available on Team Contractor and higher plans.",
    ctaLabel: "Explore plan options",
    learnMoreLabel: "AI insights and recommendations",
    promptVariant: "explore_higher_plan",
  },
  integrations: {
    capabilityKey: "integrations",
    label: "Integrations",
    requiredPlanCode: "business_operations",
    title: "Integrations",
    description: "API and integration readiness are available on Business Operations.",
    ctaLabel: "Explore Business Operations",
    learnMoreLabel: "API and integrations",
    promptVariant: "explore_higher_plan",
  },
  sso: {
    capabilityKey: "sso",
    label: "SSO",
    requiredPlanCode: "enterprise",
    title: "SSO",
    description: "Single sign-on is available on Enterprise.",
    ctaLabel: "Contact us for enterprise rollout",
    learnMoreLabel: "SSO and enterprise controls",
    promptVariant: "enterprise_contact",
  },
  auditLogs: {
    capabilityKey: "auditLogs",
    label: "Audit logs",
    requiredPlanCode: "enterprise",
    title: "Audit logs",
    description: "Audit logs are available on Enterprise.",
    ctaLabel: "Contact us for enterprise rollout",
    learnMoreLabel: "Audit and compliance",
    promptVariant: "enterprise_contact",
  },
  apiAccess: {
    capabilityKey: "apiAccess",
    label: "API access",
    requiredPlanCode: "business_operations",
    title: "API access",
    description: "API access is available on Business Operations.",
    ctaLabel: "Explore Business Operations",
    learnMoreLabel: "API and integrations",
    promptVariant: "explore_higher_plan",
  },
};

/** Safe CTA target route. Always internal, never checkout. */
export const UPGRADE_PROMPT_CTA_ROUTE = "/billing";

/** Check if current plan has capability (by plan level). */
export function isCapabilityAvailableForPlan(capabilityKey: CapabilityKeyForPrompt, planCode: PlanCode): boolean {
  const config = CAPABILITY_PROMPT_CONFIG[capabilityKey];
  const requiredLevel = planLevel(config.requiredPlanCode);
  const currentLevel = planLevel(planCode);
  return currentLevel >= requiredLevel;
}

export function getRequiredPlanName(capabilityKey: CapabilityKeyForPrompt): string {
  return PLAN_DISPLAY_COPY[CAPABILITY_PROMPT_CONFIG[capabilityKey].requiredPlanCode].name;
}
