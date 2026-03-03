import type { AnalysisResult } from "./types";

const defaultResult: AnalysisResult = {
  stage: "foundation",
  completion_percent: 45,
  risk_level: "medium",
  detected_issues: ["exposed rebar"],
  recommendations: ["Cover before rain"],
};

/**
 * Build a valid AnalysisResult for tests. Override any field.
 */
export function createMockAnalysisResult(
  overrides?: Partial<AnalysisResult>
): AnalysisResult {
  return { ...defaultResult, ...overrides };
}
