/**
 * Deterministic portfolio intelligence layer.
 * Aggregates project metrics, distribution, ranking, outlier, summary.
 * No new backend; uses existing project data.
 */

import { computeProjection } from "./projection";
import { computeGovernance } from "./governance";
import { computeStrategicRisk } from "./strategicRisk";
import { computeHealthScore } from "./healthScore";
import { validateAnalysisResult } from "@/lib/api/validateAnalysisResult";
import type { AnalysisSnapshot } from "./metrics";

const OUTLIER_THRESHOLD = 25;

export type HealthClassification =
  | "Healthy"
  | "Moderate"
  | "Unstable"
  | "Critical";

export interface ProjectMetrics {
  projectId: string;
  projectName: string;
  healthScore: number;
  healthClassification: HealthClassification;
  strategicRiskIndex: number;
  delayProbabilityHigh: boolean;
  slowdownTrend: boolean;
}

/** Analysis row shape (from DB) for one project */
export interface AnalysisRow {
  stage: string | null;
  completion_percent: number;
  risk_level: string;
  detected_issues: string[] | null;
  recommendations: string[] | null;
  created_at: string;
}

/**
 * Compute health_score, strategic_risk_index, delay_probability, classification, slowdown for one project from its analyses.
 */
export function getProjectMetrics(
  projectId: string,
  projectName: string,
  analyses: AnalysisRow[]
): ProjectMetrics {
  const sorted = [...analyses].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const history: AnalysisSnapshot[] = sorted.map((a) => ({
    created_at: a.created_at,
    stage: a.stage,
    completion_percent: a.completion_percent,
    risk_level: a.risk_level as "low" | "medium" | "high",
  }));
  const proj = computeProjection(history);
  const latest =
    sorted.length > 0 ? sorted[sorted.length - 1] : null;
  const previousSnapshot =
    sorted.length >= 2
      ? {
          completion_percent: sorted[sorted.length - 2].completion_percent,
          created_at: sorted[sorted.length - 2].created_at,
        }
      : null;

  let confidenceScore = 100;
  let regressionAnomaly = false;
  let jumpAnomaly = false;
  let logicalInconsistency = false;
  if (latest) {
    const validation = validateAnalysisResult({
      stage: latest.stage ?? "",
      completion_percent: latest.completion_percent,
      risk_level: latest.risk_level as "low" | "medium" | "high",
      detected_issues: latest.detected_issues ?? [],
      recommendations: latest.recommendations ?? [],
    });
    if (validation.success) {
      const gov = computeGovernance(
        {
          ...validation.data,
          created_at: latest.created_at,
        },
        previousSnapshot
      );
      confidenceScore = gov.confidenceScore;
      regressionAnomaly = gov.regressionAnomaly;
      jumpAnomaly = gov.jumpAnomaly;
      logicalInconsistency = gov.logicalInconsistency;
    }
  }

  const strategicResult = computeStrategicRisk({
    riskLevel: (latest?.risk_level ?? "low") as "low" | "medium" | "high",
    slowdownTrend: proj.slowdownTrend,
    delayProbabilityHigh: proj.delayProbability === "high",
    confidenceBelow60: confidenceScore < 60,
    regressionAnomaly,
    logicalInconsistency,
  });

  const healthResult = computeHealthScore({
    strategicRiskIndex: strategicResult.strategicRiskIndex,
    confidenceScore,
    delayProbabilityHigh: proj.delayProbability === "high",
    slowdownTrend: proj.slowdownTrend,
    anomalyFlagCount: [regressionAnomaly, jumpAnomaly, logicalInconsistency].filter(Boolean).length,
  });

  return {
    projectId,
    projectName,
    healthScore: healthResult.healthScore,
    healthClassification: healthResult.classification,
    strategicRiskIndex: strategicResult.strategicRiskIndex,
    delayProbabilityHigh: proj.delayProbability === "high",
    slowdownTrend: proj.slowdownTrend,
  };
}

export interface PortfolioDistribution {
  percentHealthy: number;
  percentModerate: number;
  percentUnstable: number;
  percentCritical: number;
}

export interface PortfolioResult {
  distribution: PortfolioDistribution;
  /** Projects sorted by risk (worst first): strategic_risk_index desc, delay high first, health_score asc */
  rankedProjects: (ProjectMetrics & { portfolioOutlier: boolean })[];
  summary: string;
}

/**
 * Compute portfolio distribution (% in each health class), rank projects, flag outliers, generate summary.
 */
export function computePortfolio(
  projects: ProjectMetrics[]
): PortfolioResult {
  const n = projects.length;
  const healthy = projects.filter((p) => p.healthClassification === "Healthy").length;
  const moderate = projects.filter((p) => p.healthClassification === "Moderate").length;
  const unstable = projects.filter((p) => p.healthClassification === "Unstable").length;
  const critical = projects.filter((p) => p.healthClassification === "Critical").length;

  const distribution: PortfolioDistribution = {
    percentHealthy: n > 0 ? (healthy / n) * 100 : 0,
    percentModerate: n > 0 ? (moderate / n) * 100 : 0,
    percentUnstable: n > 0 ? (unstable / n) * 100 : 0,
    percentCritical: n > 0 ? (critical / n) * 100 : 0,
  };

  const avgHealth = n > 0 ? projects.reduce((s, p) => s + p.healthScore, 0) / n : 0;
  const cutoff = avgHealth - OUTLIER_THRESHOLD;

  const withOutlier = projects.map((p) => ({
    ...p,
    portfolioOutlier: p.healthScore < cutoff,
  }));

  const ranked = [...withOutlier].sort((a, b) => {
    if (b.strategicRiskIndex !== a.strategicRiskIndex)
      return b.strategicRiskIndex - a.strategicRiskIndex;
    const aHigh = a.delayProbabilityHigh ? 1 : 0;
    const bHigh = b.delayProbabilityHigh ? 1 : 0;
    if (bHigh !== aHigh) return bHigh - aHigh;
    return a.healthScore - b.healthScore;
  });

  const slowdownCount = projects.filter((p) => p.slowdownTrend).length;
  const summary = buildPortfolioSummary(
    n,
    distribution,
    critical,
    slowdownCount
  );

  return {
    distribution,
    rankedProjects: ranked,
    summary,
  };
}

function buildPortfolioSummary(
  projectCount: number,
  dist: PortfolioDistribution,
  criticalCount: number,
  slowdownCount: number
): string {
  if (projectCount === 0)
    return "No projects. Create projects and run analyses to see portfolio intelligence.";

  const parts: string[] = [];
  parts.push(
    `Portfolio: ${dist.percentHealthy.toFixed(0)}% Healthy, ${dist.percentModerate.toFixed(0)}% Moderate, ${dist.percentUnstable.toFixed(0)}% Unstable, ${dist.percentCritical.toFixed(0)}% Critical.`
  );
  if (criticalCount > 0)
    parts.push(`${criticalCount} project(s) in Critical health.`);
  if (slowdownCount > 0)
    parts.push(`${slowdownCount} project(s) show slowdown trend.`);
  if (criticalCount === 0 && slowdownCount === 0)
    parts.push("No critical projects or systemic slowdown detected.");
  return parts.join(" ");
}
