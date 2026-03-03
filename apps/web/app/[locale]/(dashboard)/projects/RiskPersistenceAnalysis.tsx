"use client";

import { computeProjection } from "@/lib/intelligence/projection";
import { computeGovernance } from "@/lib/intelligence/governance";
import { computeStrategicRisk } from "@/lib/intelligence/strategicRisk";
import { computeTimeWeighted } from "@/lib/intelligence/timeWeighted";
import { validateAnalysisResult } from "@/lib/api/validateAnalysisResult";
import type { AnalysisSnapshot } from "@/lib/intelligence/metrics";
import type { AiAnalysis } from "@/lib/types";

interface PreviousSnapshot {
  completion_percent: number;
  created_at: string;
}

export function RiskPersistenceAnalysis({
  history,
  latestAnalysis,
  previousSnapshot,
}: {
  history: AnalysisSnapshot[];
  latestAnalysis: AiAnalysis | null;
  previousSnapshot: PreviousSnapshot | null;
}) {
  if (history.length < 2) {
    return (
      <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-4 text-sm text-aistroyka-text-secondary sm:p-6">
        Risk Persistence Analysis: Need at least 2 analyses to compute duration and slowdown.
      </div>
    );
  }

  const proj = computeProjection(history);
  let confidenceBelow60 = false;
  let regressionAnomaly = false;
  let logicalInconsistency = false;
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
      confidenceBelow60 = gov.confidenceScore < 60;
      regressionAnomaly = gov.regressionAnomaly;
      logicalInconsistency = gov.logicalInconsistency;
    }
  }

  const strategicResult = computeStrategicRisk({
    riskLevel: (latestAnalysis?.risk_level ?? "low") as "low" | "medium" | "high",
    slowdownTrend: proj.slowdownTrend,
    delayProbabilityHigh: proj.delayProbability === "high",
    confidenceBelow60,
    regressionAnomaly,
    logicalInconsistency,
  });

  const timeWeighted = computeTimeWeighted(
    history,
    strategicResult.strategicRiskIndex
  );

  return (
    <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-4 text-sm sm:p-6">
      <div className="font-medium text-aistroyka-text-primary">Risk Persistence Analysis</div>
      <div className="mt-4 grid gap-2 text-aistroyka-text-primary sm:grid-cols-2">
        <div>
          <span className="text-aistroyka-text-tertiary">Risk duration:</span>{" "}
          {timeWeighted.persistentHighRisk
            ? `${timeWeighted.riskDurationDays.toFixed(0)} days`
            : "—"}
        </div>
        <div>
          <span className="text-aistroyka-text-tertiary">Slowdown duration:</span>{" "}
          {timeWeighted.persistentSlowdown
            ? `${timeWeighted.slowdownDurationIntervals} intervals`
            : "—"}
        </div>
        <div>
          <span className="text-aistroyka-text-tertiary">Escalation flag:</span>{" "}
          {timeWeighted.escalationFlag ? "Yes" : "No"}
        </div>
        {timeWeighted.escalationFlag && (
          <div>
            <span className="text-aistroyka-text-tertiary">Time-weighted risk index:</span>{" "}
            {timeWeighted.adjustedStrategicRiskIndex}
          </div>
        )}
        {timeWeighted.healthAdjustment !== 0 && (
          <div>
            <span className="text-aistroyka-text-tertiary">Health adjustment:</span>{" "}
            {timeWeighted.healthAdjustment} (extended issue duration)
          </div>
        )}
      </div>
    </div>
  );
}
