"use client";

import { useTranslations } from "next-intl";
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
  const tDetail = useTranslations("dashboardDetail");
  if (history.length < 2) {
    return (
      <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-4 text-sm text-aistroyka-text-secondary sm:p-6">
        {tDetail("riskPersistenceAnalysisEmpty")}
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
      <div className="font-medium text-aistroyka-text-primary">{tDetail("riskPersistenceAnalysis")}</div>
      <div className="mt-4 grid gap-2 text-aistroyka-text-primary sm:grid-cols-2">
        <div>
          <span className="text-aistroyka-text-tertiary">{tDetail("riskDuration")}:</span>{" "}
          {timeWeighted.persistentHighRisk
            ? tDetail("daysCount", { count: timeWeighted.riskDurationDays.toFixed(0) })
            : "—"}
        </div>
        <div>
          <span className="text-aistroyka-text-tertiary">{tDetail("slowdownDuration")}:</span>{" "}
          {timeWeighted.persistentSlowdown
            ? tDetail("intervalsCount", { count: timeWeighted.slowdownDurationIntervals })
            : "—"}
        </div>
        <div>
          <span className="text-aistroyka-text-tertiary">{tDetail("escalationFlag")}:</span>{" "}
          {timeWeighted.escalationFlag ? tDetail("yes") : tDetail("no")}
        </div>
        {timeWeighted.escalationFlag && (
          <div>
            <span className="text-aistroyka-text-tertiary">{tDetail("timeWeightedRiskIndex")}:</span>{" "}
            {timeWeighted.adjustedStrategicRiskIndex}
          </div>
        )}
        {timeWeighted.healthAdjustment !== 0 && (
          <div>
            <span className="text-aistroyka-text-tertiary">{tDetail("healthAdjustment")}:</span>{" "}
            {timeWeighted.healthAdjustment} ({tDetail("extendedIssueDuration")})
          </div>
        )}
      </div>
    </div>
  );
}
