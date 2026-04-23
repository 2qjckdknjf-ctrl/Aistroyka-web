/**
 * Plan surface view-model builder.
 * Step 10: canonical display layer for current plan, limits, capabilities, upgrade suggestions.
 */

import type { PlanCode } from "@aistroyka/contracts";
import type { WorkspacePlanContext } from "./workspace-plan-context.types";
import { PLAN_ENTITLEMENTS_DEFAULTS } from "./entitlements-config";
import type {
  PlanSurfaceViewModel,
  PlanLimitsSummary,
  CapabilityGroupSummary,
  UpgradeSuggestion,
  UpgradeCtaVariant,
} from "./plan-surface.types";
import { PLAN_DISPLAY_COPY, UPGRADE_CTA_COPY } from "./plan-surface-copy";

/** Map raw capabilities to UI-friendly groups. */
function buildCapabilityGroups(caps: WorkspacePlanContext["effectiveCapabilities"]): CapabilityGroupSummary[] {
  const c = caps;
  return [
    {
      key: "collaboration",
      label: "Collaboration",
      items: [
        { key: "projects", label: "Projects", enabled: c.projects },
        { key: "tasks", label: "Tasks", enabled: c.tasks },
        { key: "commentsMentions", label: "Comments & mentions", enabled: c.commentsMentions },
        { key: "notifications", label: "Notifications", enabled: c.notifications },
      ],
    },
    {
      key: "reporting",
      label: "Reporting",
      items: [
        { key: "dailyReports", label: "Daily reports", enabled: c.dailyReports },
        { key: "photoEvidence", label: "Photo evidence", enabled: c.photoEvidence },
        { key: "summaryGeneration", label: "Summary generation", enabled: c.summaryGeneration },
      ],
    },
    {
      key: "approvals_docs",
      label: "Approvals & documents",
      items: [
        { key: "approvals", label: "Approvals", enabled: c.approvals },
        { key: "advancedApprovals", label: "Advanced approvals", enabled: c.advancedApprovals },
        { key: "documents", label: "Documents", enabled: c.documents },
        { key: "advancedDocuments", label: "Advanced documents", enabled: c.advancedDocuments },
      ],
    },
    {
      key: "analytics_ai",
      label: "Analytics & AI",
      items: [
        { key: "basicDashboard", label: "Basic dashboard", enabled: c.basicDashboard },
        { key: "managerAi", label: "Manager AI", enabled: c.managerAi },
        { key: "advancedAnalytics", label: "Advanced analytics", enabled: c.advancedAnalytics },
        { key: "portfolioAnalytics", label: "Portfolio analytics", enabled: c.portfolioAnalytics },
      ],
    },
    {
      key: "enterprise",
      label: "Enterprise controls",
      items: [
        { key: "sso", label: "SSO", enabled: c.sso },
        { key: "auditLogs", label: "Audit logs", enabled: c.auditLogs },
        { key: "integrations", label: "Integrations", enabled: c.integrations },
        { key: "apiAccess", label: "API access", enabled: c.apiAccess },
      ],
    },
  ];
}

function getUpgradeSuggestion(planCode: PlanCode): UpgradeSuggestion {
  const variantAndPlan: { variant: UpgradeCtaVariant; plan: PlanCode | null } = (() => {
    switch (planCode) {
      case "client_personal":
        return { variant: "explore_plans", plan: "team_contractor" };
      case "team_contractor":
        return { variant: "see_business_options", plan: "business_operations" };
      case "business_operations":
        return { variant: "contact_enterprise", plan: "enterprise" };
      case "enterprise":
        return { variant: "managed_plan", plan: null };
      default:
        return { variant: "none", plan: null };
    }
  })();

  const copy = UPGRADE_CTA_COPY[variantAndPlan.variant] ?? UPGRADE_CTA_COPY.none;
  return {
    suggestedPlanCode: variantAndPlan.plan,
    ctaVariant: variantAndPlan.variant,
    ctaCopy: copy.cta,
    learnMoreCopy: copy.learnMore,
  };
}

function sourceKindToLabel(sourceKind: WorkspacePlanContext["sourceKind"]): string {
  switch (sourceKind) {
    case "canonical_plan":
      return "Selected plan";
    case "legacy_tier_bridge":
      return "Legacy plan (mapped)";
    case "override":
      return "Override";
    default:
      return "Plan";
  }
}

/**
 * Build plan surface view model from workspace plan context.
 * Safe for legacy bridge: sourceKind and sourceLabel reflect origin.
 */
export function getPlanSurfaceViewModel(context: WorkspacePlanContext): PlanSurfaceViewModel {
  const planCode = context.canonicalPlanCode;
  const copy = PLAN_DISPLAY_COPY[planCode];
  const limits = context.effectiveEntitlements.limits;
  const caps = context.effectiveCapabilities;

  const limitsSummary: PlanLimitsSummary = {
    maxUsers: limits.maxUsers,
    maxProjects: limits.maxProjects,
    maxStorageGb: limits.maxStorageGb,
    maxActiveMobileWorkers: limits.maxActiveMobileWorkers,
    maxMonthlyAiRequests: limits.maxMonthlyAiRequests,
  };

  return {
    currentPlanCode: planCode,
    humanReadablePlanName: copy.name,
    sourceKind: context.sourceKind,
    sourceLabel: sourceKindToLabel(context.sourceKind),
    planDescriptionShort: copy.descriptionShort,
    limitsSummary,
    capabilityGroups: buildCapabilityGroups(caps),
    upgradeSuggestion: getUpgradeSuggestion(planCode),
    isEnterprise: planCode === "enterprise",
    isLegacyBridge: context.sourceKind === "legacy_tier_bridge",
  };
}

/** Safe internal route for upgrade CTA. Never checkout or provider URL. */
export function getUpgradeCtaTargetRoute(_variant: UpgradeCtaVariant): string {
  return "/billing";
}

/** Plan badge label. Fallback when surface missing. */
export function getPlanBadgeLabel(surface: PlanSurfaceViewModel | null | undefined): string {
  return surface?.humanReadablePlanName ?? "Plan";
}

/** Plan card title. */
export function getPlanCardTitle(surface: PlanSurfaceViewModel): string {
  return surface.humanReadablePlanName;
}

/** Safe error message for plan surface. No misleading billing promise. */
export function getPlanSurfaceErrorMessage(error?: Error | null): string {
  const suffix = error?.message ?? "Please refresh the page.";
  return `Unable to load plan information. ${suffix}`;
}

/**
 * Build fallback view model when context is missing.
 * Uses client_personal as safe default.
 */
export function getPlanSurfaceFallback(planCode: PlanCode = "client_personal"): PlanSurfaceViewModel {
  const copy = PLAN_DISPLAY_COPY[planCode];
  const ent = PLAN_ENTITLEMENTS_DEFAULTS[planCode];
  const limits = ent.limits;
  const caps = ent.capabilities;

  return {
    currentPlanCode: planCode,
    humanReadablePlanName: copy.name,
    sourceKind: "canonical_plan",
    sourceLabel: "Default",
    planDescriptionShort: copy.descriptionShort,
    limitsSummary: {
      maxUsers: limits.maxUsers,
      maxProjects: limits.maxProjects,
      maxStorageGb: limits.maxStorageGb,
      maxActiveMobileWorkers: limits.maxActiveMobileWorkers,
      maxMonthlyAiRequests: limits.maxMonthlyAiRequests,
    },
    capabilityGroups: buildCapabilityGroups(caps),
    upgradeSuggestion: getUpgradeSuggestion(planCode),
    isEnterprise: planCode === "enterprise",
    isLegacyBridge: false,
  };
}
