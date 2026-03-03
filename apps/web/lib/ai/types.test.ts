import { describe, expect, it } from "vitest";
import { createMockAnalysisResult } from "./test-helpers";
import { isAnalysisResult } from "./types";

const valid = createMockAnalysisResult();

describe("isAnalysisResult", () => {
  it("accepts valid result", () => {
    expect(isAnalysisResult(valid)).toBe(true);
    expect(isAnalysisResult({ ...valid, risk_level: "low" })).toBe(true);
    expect(isAnalysisResult({ ...valid, risk_level: "high" })).toBe(true);
    expect(isAnalysisResult({ ...valid, detected_issues: [], recommendations: [] })).toBe(true);
  });

  it("rejects null and undefined", () => {
    expect(isAnalysisResult(null)).toBe(false);
    expect(isAnalysisResult(undefined)).toBe(false);
  });

  it("rejects non-objects", () => {
    expect(isAnalysisResult("string")).toBe(false);
    expect(isAnalysisResult(42)).toBe(false);
    expect(isAnalysisResult(true)).toBe(false);
    expect(isAnalysisResult([])).toBe(false);
  });

  it("rejects wrong stage type", () => {
    expect(isAnalysisResult({ ...valid, stage: 1 })).toBe(false);
    expect(isAnalysisResult({ ...valid, stage: null })).toBe(false);
  });

  it("rejects wrong completion_percent type", () => {
    expect(isAnalysisResult({ ...valid, completion_percent: "50" })).toBe(false);
    expect(isAnalysisResult({ ...valid, completion_percent: null })).toBe(false);
  });

  it("rejects invalid risk_level", () => {
    expect(isAnalysisResult({ ...valid, risk_level: "critical" })).toBe(false);
    expect(isAnalysisResult({ ...valid, risk_level: "" })).toBe(false);
    expect(isAnalysisResult({ ...valid, risk_level: 1 })).toBe(false);
  });

  it("rejects non-array or invalid detected_issues", () => {
    expect(isAnalysisResult({ ...valid, detected_issues: "list" })).toBe(false);
    expect(isAnalysisResult({ ...valid, detected_issues: [1, 2] })).toBe(false);
    expect(isAnalysisResult({ ...valid, detected_issues: ["ok", null] })).toBe(false);
  });

  it("rejects non-array or invalid recommendations", () => {
    expect(isAnalysisResult({ ...valid, recommendations: "list" })).toBe(false);
    expect(isAnalysisResult({ ...valid, recommendations: [1] })).toBe(false);
  });

  it("rejects missing required fields", () => {
    const { stage, ...noStage } = valid;
    expect(isAnalysisResult(noStage)).toBe(false);
    const { completion_percent, ...noPct } = valid;
    expect(isAnalysisResult(noPct)).toBe(false);
    const { risk_level, ...noRisk } = valid;
    expect(isAnalysisResult(noRisk)).toBe(false);
    const { detected_issues, ...noIssues } = valid;
    expect(isAnalysisResult(noIssues)).toBe(false);
    const { recommendations, ...noRec } = valid;
    expect(isAnalysisResult(noRec)).toBe(false);
  });
});
