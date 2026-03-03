/**
 * Build DecisionContextPayload from project/analysis data for Copilot.
 */

import type { DecisionContextPayload } from "./types";

export interface ProjectAnalysisSource {
  risk_level?: "low" | "medium" | "high" | null;
  completion_percent?: number | null;
  detected_issues?: string[] | null;
  recommendations?: string[] | null;
  stage?: string | null;
}

export interface ProjectContextSource {
  healthScore?: number | null;
  delayProbability?: "low" | "medium" | "high" | null;
  velocityTrend?: string | null;
  forecastDate?: string | null;
}

/**
 * Build a minimal decision_context for Copilot from project page data.
 */
export function buildDecisionContextFromProject(
  analysis: ProjectAnalysisSource | null,
  projectContext?: ProjectContextSource | null
): DecisionContextPayload {
  const riskToScore = (r: string | undefined) =>
    r === "high" ? 75 : r === "medium" ? 50 : 25;
  const overall_risk = analysis?.risk_level
    ? riskToScore(analysis.risk_level)
    : projectContext?.healthScore != null
      ? Math.max(0, Math.min(100, 100 - (projectContext.healthScore ?? 0)))
      : 0;

  const top_risk_factors = (analysis?.detected_issues ?? []).slice(0, 10).map((name) => ({
    name,
    score: 50,
    weight: 1,
  }));

  const delayProbability = projectContext?.delayProbability ?? null;
  const projected_delay_date = projectContext?.forecastDate ?? null;
  const velocity_trend = projectContext?.velocityTrend ?? "unknown";
  const anomalies = (analysis?.recommendations ?? []).slice(0, 5);

  return {
    overall_risk,
    confidence: 0.8,
    top_risk_factors,
    projected_delay_date,
    velocity_trend,
    anomalies,
    aggregated_at: new Date().toISOString(),
  };
}
