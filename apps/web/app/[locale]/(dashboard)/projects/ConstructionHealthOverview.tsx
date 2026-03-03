"use client";

import { computeProjection } from "@/lib/intelligence/projection";
import { computeGovernance } from "@/lib/intelligence/governance";
import { computeStrategicRisk } from "@/lib/intelligence/strategicRisk";
import { computeHealthScore } from "@/lib/intelligence/healthScore";
import { validateAnalysisResult } from "@/lib/api/validateAnalysisResult";
import type { AnalysisSnapshot } from "@/lib/intelligence/metrics";
import type { AiAnalysis } from "@/lib/types";

interface PreviousSnapshot {
  completion_percent: number;
  created_at: string;
}

function classificationFromScore(score: number): "Healthy" | "Moderate" | "Unstable" | "Critical" {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Unstable";
  return "Critical";
}

export function ConstructionHealthOverview({
  history,
  latestAnalysis,
  previousSnapshot,
  healthAdjustment = 0,
}: {
  history: AnalysisSnapshot[];
  latestAnalysis: AiAnalysis | null;
  previousSnapshot: PreviousSnapshot | null;
  healthAdjustment?: number;
}) {
  if (history.length === 0 && !latestAnalysis) {
    return (
      <div className="card text-sm text-aistroyka-text-secondary">
        Construction Health Overview: No analyses yet. Run analyses to see
        health score.
      </div>
    );
  }

  const proj = computeProjection(history);
  let confidenceScore = 100;
  let regressionAnomaly = false;
  let logicalInconsistency = false;
  let anomalyFlagCount = 0;
  if (latestAnalysis) {
    const validation = validateAnalysisResult({
      stage: latestAnalysis.stage ?? "",
      completion_percent: latestAnalysis.completion_percent,
      risk_level: latestAnalysis.risk_level,
      detected_issues: latestAnalysis.detected_issues ?? [],
      recommendations: latestAnalysis.recommendations ?? [],
    });
    if (validation.success) {
      const gov = computeGovernance(
        { ...validation.data, created_at: latestAnalysis.created_at },
        previousSnapshot
      );
      confidenceScore = gov.confidenceScore;
      regressionAnomaly = gov.regressionAnomaly;
      logicalInconsistency = gov.logicalInconsistency;
      if (gov.regressionAnomaly) anomalyFlagCount += 1;
      if (gov.jumpAnomaly) anomalyFlagCount += 1;
      if (gov.logicalInconsistency) anomalyFlagCount += 1;
    }
  }

  const strategicResult = computeStrategicRisk({
    riskLevel: (latestAnalysis?.risk_level ?? "low") as "low" | "medium" | "high",
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
    anomalyFlagCount,
  });

  const adjustedScore = Math.max(0, Math.min(100, healthResult.healthScore + healthAdjustment));
  const displayClassification = healthAdjustment !== 0 ? classificationFromScore(adjustedScore) : healthResult.classification;
  const classificationClass =
    displayClassification === "Healthy"
      ? "text-emerald-700"
      : displayClassification === "Moderate"
        ? "text-blue-700"
        : displayClassification === "Unstable"
          ? "text-aistroyka-warning"
          : "text-red-700";

  return (
    <div className="card text-sm">
      <div className="font-semibold text-aistroyka-text-primary">Construction Health Overview</div>
      <div className="mt-3 grid gap-x-4 gap-y-1 text-aistroyka-text-primary sm:grid-cols-2">
        <div>
          <span className="text-aistroyka-text-tertiary">Health Score:</span> {adjustedScore}
          {healthAdjustment !== 0 && (
            <span className="ml-1 text-xs text-aistroyka-text-tertiary">
              (base {healthResult.healthScore}{healthAdjustment < 0 ? ` ${healthAdjustment}` : ` +${healthAdjustment}`})
            </span>
          )}
        </div>
        <div>
          <span className="text-aistroyka-text-tertiary">Classification:</span> <span className={classificationClass}>{displayClassification}</span>
        </div>
      </div>
      <p className="mt-3 max-w-prose text-aistroyka-text-primary leading-relaxed">{healthResult.executiveSummary}</p>
    </div>
  );
}
