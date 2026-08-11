import { describe, expect, it } from "vitest";
import {
  dashboardAiReadinessBadgeVariant,
  isFalseLiveReadinessLabel,
  resolveDashboardAiReadiness,
} from "./dashboard-ai-readiness";

describe("resolveDashboardAiReadiness", () => {
  it("returns not_configured when vision is not configured", () => {
    expect(
      resolveDashboardAiReadiness({
        visionConfigured: false,
        failedCount: 3,
        deadCount: 1,
      })
    ).toBe("not_configured");
  });

  it("returns configured_unverified when keys appear present and no failures", () => {
    expect(
      resolveDashboardAiReadiness({
        visionConfigured: true,
        failedCount: 0,
        deadCount: 0,
      })
    ).toBe("configured_unverified");
  });

  it("treats unknown visionConfigured as configured_unverified (never LIVE)", () => {
    expect(resolveDashboardAiReadiness({ visionConfigured: null })).toBe(
      "configured_unverified"
    );
    expect(resolveDashboardAiReadiness({ visionConfigured: undefined })).toBe(
      "configured_unverified"
    );
  });

  it("returns degraded when failed or dead jobs exist and vision is configured", () => {
    expect(
      resolveDashboardAiReadiness({
        visionConfigured: true,
        failedCount: 1,
        deadCount: 0,
      })
    ).toBe("degraded");
    expect(
      resolveDashboardAiReadiness({
        visionConfigured: true,
        failedCount: 0,
        deadCount: 2,
      })
    ).toBe("degraded");
  });

  it("never resolves to a LIVE readiness state", () => {
    const states = [
      resolveDashboardAiReadiness({ visionConfigured: false }),
      resolveDashboardAiReadiness({ visionConfigured: true }),
      resolveDashboardAiReadiness({ visionConfigured: true, failedCount: 1 }),
      resolveDashboardAiReadiness({ visionConfigured: null }),
    ];
    expect(states).not.toContain("live");
    expect(states.every((s) => s !== "LIVE")).toBe(true);
  });
});

describe("dashboardAiReadinessBadgeVariant", () => {
  it("maps readiness to existing Badge variants", () => {
    expect(dashboardAiReadinessBadgeVariant("not_configured")).toBe("neutral");
    expect(dashboardAiReadinessBadgeVariant("configured_unverified")).toBe("warning");
    expect(dashboardAiReadinessBadgeVariant("degraded")).toBe("danger");
  });
});

describe("isFalseLiveReadinessLabel", () => {
  it("detects LIVE claims in labels", () => {
    expect(isFalseLiveReadinessLabel("LIVE")).toBe(true);
    expect(isFalseLiveReadinessLabel("AI LIVE")).toBe(true);
    expect(isFalseLiveReadinessLabel("Configured (unverified)")).toBe(false);
  });
});
