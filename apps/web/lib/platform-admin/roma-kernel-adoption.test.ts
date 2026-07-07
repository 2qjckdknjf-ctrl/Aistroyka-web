import { describe, expect, it } from "vitest";
import type {
  RomaConfidence,
  RomaReleaseDecision,
  RomaRiskLevel,
  RomaSeverity,
  RomaTestDomain,
} from "@aistroyka/roma-kernel";
import type { BlockerSeverity, LiveSourceStatus, ReadinessLevel } from "./roma-quality-dashboard.types";
import type { ConfidenceLevel, ReleaseDecision } from "./roma-engineering-intelligence.types";
import type {
  RomaChangeConfidence,
  RomaChangeReleaseImpact,
  RomaChangeRiskLevel,
} from "./roma-change-intelligence.types";
import type { RomaTestCatalogDomain, RomaTestCatalogPriority } from "./roma-test-catalog.types";
import type { HealthBucket } from "./executive-dashboard-ui";

describe("ROMA kernel adoption (stage 1 re-exports)", () => {
  it("re-exports severity from kernel via dashboard types", () => {
    const severity: BlockerSeverity = "critical";
    const kernelSeverity: RomaSeverity = severity;
    expect(kernelSeverity).toBe("critical");
  });

  it("re-exports release and confidence from kernel via intelligence types", () => {
    const release: ReleaseDecision = "ready_with_warnings";
    const kernelRelease: RomaReleaseDecision = release;
    const confidence: ConfidenceLevel = "high";
    expect(kernelRelease).toBe("ready_with_warnings");
    expect(confidence).toBe("high");
  });

  it("re-exports change intelligence enums from kernel", () => {
    const c: RomaChangeConfidence = "unknown";
    const r: RomaChangeRiskLevel = "high";
    const i: RomaChangeReleaseImpact = "medium";
    const kc: RomaConfidence = c;
    const kr: RomaRiskLevel = r;
    expect(kc).toBe("unknown");
    expect(kr).toBe("high");
    expect(i).toBe("medium");
  });

  it("re-exports test catalog domain from kernel", () => {
    const domain: RomaTestCatalogDomain = "mobile_ios";
    const kernelDomain: RomaTestDomain = domain;
    const priority: RomaTestCatalogPriority = "p0";
    expect(kernelDomain).toBe("mobile_ios");
    expect(priority).toBe("p0");
  });

  it("re-exports probe connection status and health bucket", () => {
    const live: LiveSourceStatus = "connected";
    const bucket: HealthBucket = "healthy";
    expect(live).toBe("connected");
    expect(bucket).toBe("healthy");
  });

  it("re-exports readiness level from kernel", () => {
    const level: ReadinessLevel = "blocked";
    expect(level).toBe("blocked");
  });
});
