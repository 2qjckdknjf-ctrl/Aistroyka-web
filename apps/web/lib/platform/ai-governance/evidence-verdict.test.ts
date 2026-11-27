import { describe, expect, it } from "vitest";
import { combineEvidenceVerdict } from "./evidence-verdict";

describe("combineEvidenceVerdict (2026-11-27 P0)", () => {
  it("rejects functional PASS with security FAIL", () => {
    const result = combineEvidenceVerdict({
      functional: "PASS",
      security: "FAIL",
      repeatability: "PASS",
      runs: 3,
      sha: "abc1234",
    });
    expect(result.accepted).toBe(false);
    expect(result.overall).toBe("FAIL");
    expect(result.rule_hits).toContain("functional_pass_security_fail");
  });

  it("keeps NOT_RUN distinct from FAIL", () => {
    const result = combineEvidenceVerdict({
      functional: "PASS",
      security: "PASS",
      repeatability: "NOT_RUN",
    });
    expect(result.accepted).toBe(false);
    expect(result.overall).toBe("NOT_RUN");
    expect(result.rule_hits).toContain("not_run_present");
  });

  it("keeps UNKNOWN distinct", () => {
    const result = combineEvidenceVerdict({
      functional: "UNKNOWN",
      security: "PASS",
      repeatability: "PASS",
    });
    expect(result.overall).toBe("UNKNOWN");
    expect(result.accepted).toBe(false);
  });

  it("requires three runs when runs is provided for critical evidence", () => {
    const result = combineEvidenceVerdict({
      functional: "PASS",
      security: "PASS",
      repeatability: "PASS",
      runs: 2,
      sha: "abc1234",
    });
    expect(result.accepted).toBe(false);
    expect(result.rule_hits).toContain("critical_runs_below_three");
  });

  it("accepts triple-run PASS with SHA", () => {
    const result = combineEvidenceVerdict({
      functional: "PASS",
      security: "PASS",
      repeatability: "PASS",
      runs: 3,
      sha: "ac64d2d",
    });
    expect(result).toMatchObject({ accepted: true, overall: "PASS" });
  });
});
