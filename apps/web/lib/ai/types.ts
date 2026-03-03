/**
 * Mandatory AI analysis output format (matches engine/Aistroyk and public.ai_analysis).
 */
export type RiskLevel = "low" | "medium" | "high";

export interface AnalysisResult {
  stage: string;
  completion_percent: number;
  risk_level: RiskLevel;
  detected_issues: string[];
  recommendations: string[];
}

export function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (value == null || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.stage === "string" &&
    typeof o.completion_percent === "number" &&
    (o.risk_level === "low" || o.risk_level === "medium" || o.risk_level === "high") &&
    Array.isArray(o.detected_issues) &&
    o.detected_issues.every((i: unknown) => typeof i === "string") &&
    Array.isArray(o.recommendations) &&
    o.recommendations.every((r: unknown) => typeof r === "string")
  );
}
