import { describe, expect, it } from "vitest";
import { calibrateRiskLevel } from "./riskCalibration";

const base = {
  stage: "framing",
  completion_percent: 50,
  risk_level: "low" as const,
  detected_issues: [] as string[],
  recommendations: [] as string[],
};

describe("calibrateRiskLevel", () => {
  it("leaves high unchanged", () => {
    expect(
      calibrateRiskLevel({ ...base, risk_level: "high", detected_issues: ["safety hazard"] })
    ).toBe("high");
  });

  it("elevates low to medium when many issues", () => {
    expect(
      calibrateRiskLevel({
        ...base,
        risk_level: "low",
        detected_issues: ["a", "b", "c"],
      })
    ).toBe("medium");
  });

  it("elevates low to medium when critical keyword in issues", () => {
    expect(
      calibrateRiskLevel({
        ...base,
        risk_level: "low",
        detected_issues: ["Exposed rebar in foundation"],
      })
    ).toBe("medium");
    expect(
      calibrateRiskLevel({
        ...base,
        risk_level: "low",
        detected_issues: ["Structural integrity at risk"],
      })
    ).toBe("medium");
  });

  it("elevates medium to high when critical keyword", () => {
    expect(
      calibrateRiskLevel({
        ...base,
        risk_level: "medium",
        detected_issues: ["Safety hazard: unsecured scaffolding"],
      })
    ).toBe("high");
  });

  it("does not elevate low when few non-critical issues", () => {
    expect(
      calibrateRiskLevel({
        ...base,
        risk_level: "low",
        detected_issues: ["Minor delay", "Weather"],
      })
    ).toBe("low");
  });

  it("does not downgrade", () => {
    expect(
      calibrateRiskLevel({ ...base, risk_level: "high", detected_issues: [] })
    ).toBe("high");
  });
});
