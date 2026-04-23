import { describe, expect, it } from "vitest";
import {
  getPlanSurfaceViewModel,
  getPlanSurfaceFallback,
  getUpgradeCtaTargetRoute,
  getPlanBadgeLabel,
  getPlanCardTitle,
  getPlanSurfaceErrorMessage,
} from "./plan-surface";
import { PLAN_DISPLAY_COPY, UPGRADE_CTA_COPY } from "./plan-surface-copy";
import type { WorkspacePlanContext } from "./workspace-plan-context.types";
import { PLAN_ENTITLEMENTS_DEFAULTS } from "./entitlements-config";

function mockContext(planCode: WorkspacePlanContext["canonicalPlanCode"], sourceKind: WorkspacePlanContext["sourceKind"] = "canonical_plan"): WorkspacePlanContext {
  const ent = PLAN_ENTITLEMENTS_DEFAULTS[planCode];
  return {
    workspaceId: "w1",
    canonicalPlanCode: planCode,
    sourceKind,
    addOnCodes: [],
    effectiveEntitlements: ent,
    effectiveCapabilities: ent.capabilities,
  };
}

describe("getPlanSurfaceViewModel", () => {
  it("returns client_personal surface", () => {
    const vm = getPlanSurfaceViewModel(mockContext("client_personal"));
    expect(vm.currentPlanCode).toBe("client_personal");
    expect(vm.humanReadablePlanName).toBe("Client Personal");
    expect(vm.planDescriptionShort).toContain("clients");
    expect(vm.isEnterprise).toBe(false);
    expect(vm.upgradeSuggestion.ctaVariant).toBe("explore_plans");
    expect(vm.upgradeSuggestion.suggestedPlanCode).toBe("team_contractor");
  });

  it("returns team_contractor surface", () => {
    const vm = getPlanSurfaceViewModel(mockContext("team_contractor"));
    expect(vm.currentPlanCode).toBe("team_contractor");
    expect(vm.humanReadablePlanName).toBe("Team Contractor");
    expect(vm.upgradeSuggestion.ctaVariant).toBe("see_business_options");
    expect(vm.upgradeSuggestion.suggestedPlanCode).toBe("business_operations");
  });

  it("returns business_operations surface", () => {
    const vm = getPlanSurfaceViewModel(mockContext("business_operations"));
    expect(vm.currentPlanCode).toBe("business_operations");
    expect(vm.humanReadablePlanName).toBe("Business Operations");
    expect(vm.upgradeSuggestion.ctaVariant).toBe("contact_enterprise");
    expect(vm.upgradeSuggestion.suggestedPlanCode).toBe("enterprise");
  });

  it("returns enterprise surface", () => {
    const vm = getPlanSurfaceViewModel(mockContext("enterprise"));
    expect(vm.currentPlanCode).toBe("enterprise");
    expect(vm.humanReadablePlanName).toBe("Enterprise");
    expect(vm.isEnterprise).toBe(true);
    expect(vm.upgradeSuggestion.ctaVariant).toBe("managed_plan");
    expect(vm.upgradeSuggestion.suggestedPlanCode).toBeNull();
  });

  it("shows legacy_tier_bridge source label", () => {
    const vm = getPlanSurfaceViewModel(mockContext("team_contractor", "legacy_tier_bridge"));
    expect(vm.sourceLabel).toBe("Legacy plan (mapped)");
    expect(vm.isLegacyBridge).toBe(true);
  });

  it("returns limits summary", () => {
    const vm = getPlanSurfaceViewModel(mockContext("team_contractor"));
    expect(vm.limitsSummary.maxUsers).toBe(20);
    expect(vm.limitsSummary.maxProjects).toBe(15);
    expect(vm.limitsSummary.maxStorageGb).toBe(100);
  });

  it("returns capability groups", () => {
    const vm = getPlanSurfaceViewModel(mockContext("team_contractor"));
    expect(vm.capabilityGroups.length).toBeGreaterThan(0);
    const collab = vm.capabilityGroups.find((g) => g.key === "collaboration");
    expect(collab).toBeDefined();
    expect(collab!.items.some((i) => i.key === "projects" && i.enabled)).toBe(true);
  });

  it("CTA does not point to checkout", () => {
    const copy = UPGRADE_CTA_COPY;
    expect(copy.explore_plans.cta).not.toMatch(/checkout|buy|pay|purchase/i);
    expect(copy.see_business_options.cta).not.toMatch(/checkout|buy|pay|purchase/i);
    expect(copy.contact_enterprise.cta).not.toMatch(/checkout|buy|pay|purchase/i);
  });

  it("plan card title equals humanReadablePlanName", () => {
    const vm = getPlanSurfaceViewModel(mockContext("team_contractor"));
    expect(getPlanCardTitle(vm)).toBe("Team Contractor");
  });
});

describe("getPlanSurfaceFallback", () => {
  it("returns client_personal fallback by default", () => {
    const vm = getPlanSurfaceFallback();
    expect(vm.currentPlanCode).toBe("client_personal");
    expect(vm.sourceLabel).toBe("Default");
    expect(vm.isLegacyBridge).toBe(false);
  });

  it("returns specified plan fallback", () => {
    const vm = getPlanSurfaceFallback("business_operations");
    expect(vm.currentPlanCode).toBe("business_operations");
    expect(vm.humanReadablePlanName).toBe("Business Operations");
  });
});

describe("PLAN_DISPLAY_COPY", () => {
  it("has copy for all plan codes", () => {
    expect(PLAN_DISPLAY_COPY.client_personal.name).toBeDefined();
    expect(PLAN_DISPLAY_COPY.team_contractor.name).toBeDefined();
    expect(PLAN_DISPLAY_COPY.business_operations.name).toBeDefined();
    expect(PLAN_DISPLAY_COPY.enterprise.name).toBeDefined();
  });

  it("has feature bullets for each plan", () => {
    expect(PLAN_DISPLAY_COPY.client_personal.featureBullets.length).toBeGreaterThan(0);
  });
});

describe("getUpgradeCtaTargetRoute", () => {
  it("returns safe internal route for all variants", () => {
    expect(getUpgradeCtaTargetRoute("explore_plans")).toBe("/billing");
    expect(getUpgradeCtaTargetRoute("see_business_options")).toBe("/billing");
    expect(getUpgradeCtaTargetRoute("contact_enterprise")).toBe("/billing");
    expect(getUpgradeCtaTargetRoute("managed_plan")).toBe("/billing");
    expect(getUpgradeCtaTargetRoute("none")).toBe("/billing");
  });

  it("never returns checkout or provider URL", () => {
    const variants = ["explore_plans", "see_business_options", "contact_enterprise", "managed_plan", "none"] as const;
    for (const v of variants) {
      const route = getUpgradeCtaTargetRoute(v);
      expect(route).not.toMatch(/checkout|stripe|paddle|revenuecat|pay|purchase/i);
      expect(route.startsWith("/")).toBe(true);
    }
  });
});

describe("getPlanBadgeLabel", () => {
  it("returns plan name when surface present", () => {
    const vm = getPlanSurfaceViewModel(mockContext("business_operations"));
    expect(getPlanBadgeLabel(vm)).toBe("Business Operations");
  });

  it("returns Plan fallback when surface null", () => {
    expect(getPlanBadgeLabel(null)).toBe("Plan");
  });

  it("returns Plan fallback when surface undefined", () => {
    expect(getPlanBadgeLabel(undefined)).toBe("Plan");
  });

  it("returns plan name for each plan code", () => {
    const codes = ["client_personal", "team_contractor", "business_operations", "enterprise"] as const;
    for (const code of codes) {
      const vm = getPlanSurfaceViewModel(mockContext(code));
      expect(getPlanBadgeLabel(vm)).toBe(PLAN_DISPLAY_COPY[code].name);
    }
  });
});

describe("getPlanSurfaceErrorMessage", () => {
  it("returns safe message without misleading billing promise", () => {
    const msg = getPlanSurfaceErrorMessage(null);
    expect(msg).toContain("Unable to load plan information");
    expect(msg).not.toMatch(/checkout|buy|pay|purchase|upgrade now|start trial/i);
  });

  it("includes error message when provided", () => {
    const msg = getPlanSurfaceErrorMessage(new Error("Network error"));
    expect(msg).toContain("Network error");
  });

  it("uses refresh hint when no error", () => {
    const msg = getPlanSurfaceErrorMessage(null);
    expect(msg).toContain("Please refresh the page");
  });
});

describe("fallback surface safe copy", () => {
  it("fallback surface has no misleading billing promise", () => {
    const vm = getPlanSurfaceFallback();
    expect(vm.humanReadablePlanName).not.toMatch(/checkout|buy|pay|purchase/i);
    expect(vm.planDescriptionShort).not.toMatch(/checkout|buy|pay|purchase/i);
    expect(vm.upgradeSuggestion.ctaCopy).not.toMatch(/checkout|buy|pay|purchase/i);
  });

  it("fallback upgrade CTA points to safe route", () => {
    const vm = getPlanSurfaceFallback();
    const route = getUpgradeCtaTargetRoute(vm.upgradeSuggestion.ctaVariant);
    expect(route).toBe("/billing");
  });
});

describe("legacy bridge copy", () => {
  it("legacy-mapped surface shows correct source label", () => {
    const vm = getPlanSurfaceViewModel(mockContext("team_contractor", "legacy_tier_bridge"));
    expect(vm.sourceLabel).toBe("Legacy plan (mapped)");
    expect(vm.isLegacyBridge).toBe(true);
  });

  it("legacy surface plan name comes from PLAN_DISPLAY_COPY", () => {
    const vm = getPlanSurfaceViewModel(mockContext("client_personal", "legacy_tier_bridge"));
    expect(vm.humanReadablePlanName).toBe("Client Personal");
  });
});
