import { describe, expect, it } from "vitest";
import { ROMA_KERNEL_CONSUMER_MODULES, ROMA_KERNEL_VERSION } from "./contracts/module-contract";
import type { RomaSeverity } from "./shared/severity";
import type { RomaRiskLevel } from "./risk/risk-level";
import type { RomaConfidence } from "./decision/confidence";

describe("@aistroyka/roma-kernel", () => {
  it("exports stable kernel version", () => {
    expect(ROMA_KERNEL_VERSION).toBe("1");
  });

  it("lists all consumer modules for adoption tracking", () => {
    expect(ROMA_KERNEL_CONSUMER_MODULES.length).toBe(10);
    expect(ROMA_KERNEL_CONSUMER_MODULES).toContain("executive-dashboard");
    expect(ROMA_KERNEL_CONSUMER_MODULES).toContain("execution-engine");
  });

  it("uses unified severity and risk enums", () => {
    const severity: RomaSeverity = "critical";
    const risk: RomaRiskLevel = "high";
    const confidence: RomaConfidence = "unknown";
    expect(severity).toBe("critical");
    expect(risk).toBe("high");
    expect(confidence).toBe("unknown");
  });
});
