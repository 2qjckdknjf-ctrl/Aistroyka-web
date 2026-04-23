import { describe, expect, it } from "vitest";
import {
  getFeatureUpgradePromptDisplayProps,
  isSafeCtaRoute,
  getCapabilityGateRenderMode,
  shouldShowInlineUpgradeHint,
  getAvailableWithHigherPlansItems,
  allCtaRoutesSafe,
} from "./upgrade-prompt-presentation";
import { getUpgradePromptForCapability, getDisabledCapabilityPrompts } from "./upgrade-prompt";
import { getPlanSurfaceViewModel } from "./plan-surface";
import type { WorkspacePlanContext } from "./workspace-plan-context.types";
import { PLAN_ENTITLEMENTS_DEFAULTS } from "./entitlements-config";

function mockContext(
  planCode: WorkspacePlanContext["canonicalPlanCode"],
  sourceKind: WorkspacePlanContext["sourceKind"] = "canonical_plan"
): WorkspacePlanContext {
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

describe("getFeatureUpgradePromptDisplayProps", () => {
  it("returns title, description, ctaLabel, ctaTargetRoute", () => {
    const surface = getPlanSurfaceViewModel(mockContext("team_contractor"));
    const prompt = getUpgradePromptForCapability("portfolioAnalytics", surface);
    expect(prompt).not.toBeNull();
    const props = getFeatureUpgradePromptDisplayProps(prompt!);
    expect(props.title).toBe("Portfolio command view");
    expect(props.description).toContain("Business Operations");
    expect(props.ctaLabel).toBe("Explore Business Operations");
    expect(props.ctaTargetRoute).toBe("/billing");
  });

  it("CTA target route is always safe internal", () => {
    const surface = getPlanSurfaceViewModel(mockContext("team_contractor"));
    const prompts = getDisabledCapabilityPrompts(surface);
    for (const p of prompts) {
      const props = getFeatureUpgradePromptDisplayProps(p);
      expect(props.ctaTargetRoute).toBe("/billing");
      expect(isSafeCtaRoute(props.ctaTargetRoute)).toBe(true);
    }
  });

  it("no checkout/provider wording in CTA", () => {
    const surface = getPlanSurfaceViewModel(mockContext("client_personal"));
    const prompts = getDisabledCapabilityPrompts(surface);
    for (const p of prompts) {
      const props = getFeatureUpgradePromptDisplayProps(p);
      expect(props.ctaLabel).not.toMatch(/checkout|buy|pay|purchase|add card|start paid trial/i);
    }
  });
});

describe("isSafeCtaRoute", () => {
  it("accepts /billing", () => expect(isSafeCtaRoute("/billing")).toBe(true));
  it("rejects checkout URLs", () => expect(isSafeCtaRoute("/checkout")).toBe(false));
  it("rejects stripe URLs", () => expect(isSafeCtaRoute("https://stripe.com/pay")).toBe(false));
  it("rejects external URLs", () => expect(isSafeCtaRoute("https://evil.com")).toBe(false));
});

describe("getCapabilityGateRenderMode", () => {
  it("returns skeleton when loading and blockWhileLoading", () => {
    const mode = getCapabilityGateRenderMode(null, "portfolioAnalytics", true, true);
    expect(mode).toBe("skeleton");
  });

  it("returns children when loading but not blockWhileLoading", () => {
    const surface = getPlanSurfaceViewModel(mockContext("team_contractor"));
    const mode = getCapabilityGateRenderMode(surface, "portfolioAnalytics", true, false);
    expect(mode).toBe("prompt"); // actually prompt because capability unavailable
  });

  it("returns prompt when capability unavailable", () => {
    const surface = getPlanSurfaceViewModel(mockContext("team_contractor"));
    const mode = getCapabilityGateRenderMode(surface, "portfolioAnalytics", false, true);
    expect(mode).toBe("prompt");
  });

  it("returns children when capability available", () => {
    const surface = getPlanSurfaceViewModel(mockContext("business_operations"));
    const mode = getCapabilityGateRenderMode(surface, "portfolioAnalytics", false, true);
    expect(mode).toBe("children");
  });

  it("graceful degradation: returns children when surface null", () => {
    const mode = getCapabilityGateRenderMode(null, "portfolioAnalytics", false, true);
    expect(mode).toBe("children");
  });

  it("graceful degradation: returns children when surface undefined", () => {
    const mode = getCapabilityGateRenderMode(undefined, "portfolioAnalytics", false, true);
    expect(mode).toBe("children");
  });
});

describe("shouldShowInlineUpgradeHint", () => {
  it("returns true when capability unavailable", () => {
    const surface = getPlanSurfaceViewModel(mockContext("team_contractor"));
    expect(shouldShowInlineUpgradeHint(surface, "advancedApprovals")).toBe(true);
  });

  it("returns false when capability available", () => {
    const surface = getPlanSurfaceViewModel(mockContext("business_operations"));
    expect(shouldShowInlineUpgradeHint(surface, "advancedApprovals")).toBe(false);
  });

  it("returns false when surface null (graceful)", () => {
    expect(shouldShowInlineUpgradeHint(null, "advancedApprovals")).toBe(false);
  });
});

describe("getAvailableWithHigherPlansItems", () => {
  it("returns empty for enterprise", () => {
    const surface = getPlanSurfaceViewModel(mockContext("enterprise"));
    const items = getAvailableWithHigherPlansItems(surface);
    expect(items).toHaveLength(0);
  });

  it("returns items for team_contractor", () => {
    const surface = getPlanSurfaceViewModel(mockContext("team_contractor"));
    const items = getAvailableWithHigherPlansItems(surface);
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((i) => i.capabilityKey === "portfolioAnalytics")).toBe(true);
  });

  it("returns empty when surface null", () => {
    expect(getAvailableWithHigherPlansItems(null)).toHaveLength(0);
  });

  it("all CTA routes are safe and internal", () => {
    const surface = getPlanSurfaceViewModel(mockContext("team_contractor"));
    const items = getAvailableWithHigherPlansItems(surface);
    expect(allCtaRoutesSafe(items)).toBe(true);
  });
});

describe("legacy bridge UI behavior", () => {
  it("legacy bridge prompt has soft copy", () => {
    const surface = getPlanSurfaceViewModel(mockContext("team_contractor", "legacy_tier_bridge"));
    const prompt = getUpgradePromptForCapability("portfolioAnalytics", surface);
    expect(prompt).not.toBeNull();
    expect(prompt!.isLegacyBridge).toBe(true);
    const props = getFeatureUpgradePromptDisplayProps(prompt!);
    expect(props.ctaTargetRoute).toBe("/billing");
    expect(props.ctaLabel).not.toMatch(/checkout|buy|pay|purchase/i);
  });
});
