import { describe, expect, it } from "vitest";
import {
  getUpgradePromptForCapability,
  getDisabledCapabilityPrompts,
  getContextualPlanPrompt,
  getUpgradePromptFallback,
} from "./upgrade-prompt";
import {
  CAPABILITY_PROMPT_CONFIG,
  UPGRADE_PROMPT_CTA_ROUTE,
  isCapabilityAvailableForPlan,
} from "./upgrade-prompt-config";
import { getPlanSurfaceViewModel, getPlanSurfaceFallback } from "./plan-surface";
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

describe("getUpgradePromptForCapability", () => {
  it("returns null when capability is available", () => {
    const surface = getPlanSurfaceViewModel(mockContext("business_operations"));
    expect(getUpgradePromptForCapability("portfolioAnalytics", surface)).toBeNull();
  });

  it("returns prompt for portfolioAnalytics when team_contractor", () => {
    const surface = getPlanSurfaceViewModel(mockContext("team_contractor"));
    const prompt = getUpgradePromptForCapability("portfolioAnalytics", surface);
    expect(prompt).not.toBeNull();
    expect(prompt!.title).toBe("Portfolio command view");
    expect(prompt!.requiredPlanCode).toBe("business_operations");
    expect(prompt!.ctaTargetRoute).toBe(UPGRADE_PROMPT_CTA_ROUTE);
    expect(prompt!.ctaLabel).not.toMatch(/checkout|buy|pay|purchase/i);
  });

  it("returns prompt for advancedApprovals when client_personal", () => {
    const surface = getPlanSurfaceViewModel(mockContext("client_personal"));
    const prompt = getUpgradePromptForCapability("advancedApprovals", surface);
    expect(prompt).not.toBeNull();
    expect(prompt!.requiredPlanCode).toBe("business_operations");
  });

  it("returns null for enterprise", () => {
    const surface = getPlanSurfaceViewModel(mockContext("enterprise"));
    expect(getUpgradePromptForCapability("portfolioAnalytics", surface)).toBeNull();
    expect(getUpgradePromptForCapability("sso", surface)).toBeNull();
  });

  it("returns null when surface is null", () => {
    expect(getUpgradePromptForCapability("portfolioAnalytics", null)).toBeNull();
  });

  it("CTA route is always internal and non-checkout", () => {
    const surface = getPlanSurfaceViewModel(mockContext("team_contractor"));
    const prompts = getDisabledCapabilityPrompts(surface);
    for (const p of prompts) {
      expect(p.ctaTargetRoute).toBe("/billing");
      expect(p.ctaTargetRoute).not.toMatch(/checkout|stripe|paddle|pay|purchase/i);
    }
  });

  it("legacy bridge produces safe copy", () => {
    const surface = getPlanSurfaceViewModel(mockContext("team_contractor", "legacy_tier_bridge"));
    const prompt = getUpgradePromptForCapability("portfolioAnalytics", surface);
    expect(prompt).not.toBeNull();
    expect(prompt!.isLegacyBridge).toBe(true);
    expect(prompt!.ctaLabel).not.toMatch(/checkout|buy|pay|purchase/i);
  });
});

describe("getDisabledCapabilityPrompts", () => {
  it("returns empty for enterprise", () => {
    const surface = getPlanSurfaceViewModel(mockContext("enterprise"));
    expect(getDisabledCapabilityPrompts(surface)).toHaveLength(0);
  });

  it("returns prompts for team_contractor", () => {
    const surface = getPlanSurfaceViewModel(mockContext("team_contractor"));
    const prompts = getDisabledCapabilityPrompts(surface);
    expect(prompts.length).toBeGreaterThan(0);
    const keys = prompts.map((p) => p.capabilityKey);
    expect(keys).toContain("portfolioAnalytics");
    expect(keys).toContain("advancedApprovals");
  });

  it("returns empty when surface null", () => {
    expect(getDisabledCapabilityPrompts(null)).toHaveLength(0);
  });
});

describe("getUpgradePromptFallback", () => {
  it("returns null", () => {
    expect(getUpgradePromptFallback()).toBeNull();
  });
});

describe("CAPABILITY_PROMPT_CONFIG", () => {
  it("all CTA labels are safe (no checkout)", () => {
    for (const config of Object.values(CAPABILITY_PROMPT_CONFIG)) {
      expect(config.ctaLabel).not.toMatch(/checkout|buy|pay|purchase|add card|start paid trial/i);
    }
  });

  it("CTA route is /billing", () => {
    expect(UPGRADE_PROMPT_CTA_ROUTE).toBe("/billing");
  });
});

describe("isCapabilityAvailableForPlan", () => {
  it("portfolioAnalytics requires business_operations or higher", () => {
    expect(isCapabilityAvailableForPlan("portfolioAnalytics", "client_personal")).toBe(false);
    expect(isCapabilityAvailableForPlan("portfolioAnalytics", "team_contractor")).toBe(false);
    expect(isCapabilityAvailableForPlan("portfolioAnalytics", "business_operations")).toBe(true);
    expect(isCapabilityAvailableForPlan("portfolioAnalytics", "enterprise")).toBe(true);
  });

  it("sso requires enterprise", () => {
    expect(isCapabilityAvailableForPlan("sso", "business_operations")).toBe(false);
    expect(isCapabilityAvailableForPlan("sso", "enterprise")).toBe(true);
  });
});
