"use client";

import { useTranslations } from "next-intl";
import { computeProjection } from "@/lib/intelligence/projection";
import { computeGovernance } from "@/lib/intelligence/governance";
import {
  computeStrategicRisk,
  type StrategicRiskResult,
} from "@/lib/intelligence/strategicRisk";
import { validateAnalysisResult } from "@/lib/api/validateAnalysisResult";
import type { AnalysisSnapshot } from "@/lib/intelligence/metrics";
import type { AiAnalysis } from "@/lib/types";

interface PreviousSnapshot {
  completion_percent: number;
  created_at: string;
}

export function StrategicRiskOverview({
  history,
  latestAnalysis,
  previousSnapshot,
}: {
  history: AnalysisSnapshot[];
  latestAnalysis: AiAnalysis | null;
  previousSnapshot: PreviousSnapshot | null;
}) {
  const tDetail = useTranslations("dashboardDetail");
  if (history.length === 0 && !latestAnalysis) {
    return (
      <div className="card text-sm text-aistroyka-text-secondary">
        {tDetail("strategicRiskOverviewEmpty")}
      </div>
    );
  }

  const proj = computeProjection(history);
  const riskLevel = (latestAnalysis?.risk_level ?? "low") as
    | "low"
    | "medium"
    | "high";

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

  const result: StrategicRiskResult = computeStrategicRisk({
    riskLevel,
    slowdownTrend: proj.slowdownTrend,
    delayProbabilityHigh: proj.delayProbability === "high",
    confidenceBelow60,
    regressionAnomaly,
    logicalInconsistency,
  });

  const classificationClass =
    result.classification === "Stable"
      ? "text-emerald-700"
      : result.classification === "Watch"
        ? "text-aistroyka-warning"
        : "text-red-700";
  const classificationLabel =
    result.classification === "Stable"
      ? tDetail("stable")
      : result.classification === "Watch"
        ? tDetail("watch")
        : tDetail("critical");

  return (
    <div className="card text-sm">
      <div className="font-semibold text-aistroyka-text-primary">{tDetail("strategicRiskOverview")}</div>
      <div className="mt-3 grid gap-x-4 gap-y-1 text-aistroyka-text-primary sm:grid-cols-2">
        <div><span className="text-aistroyka-text-tertiary">{tDetail("riskIndex")}:</span> {result.strategicRiskIndex}</div>
        <div><span className="text-aistroyka-text-tertiary">{tDetail("riskClassification")}:</span> <span className={classificationClass}>{classificationLabel}</span></div>
      </div>
      {result.activeDrivers.length > 0 && (
        <div className="mt-3">
          <span className="text-aistroyka-text-tertiary">{tDetail("activeDrivers")}:</span>
          <ul className="mt-1 list-inside list-disc text-aistroyka-text-primary">{result.activeDrivers.map((d) => <li key={d}>{d}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
