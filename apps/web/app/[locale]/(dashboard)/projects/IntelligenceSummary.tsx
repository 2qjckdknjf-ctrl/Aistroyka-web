"use client";

import { useTranslations } from "next-intl";
import {
  computeIntelligenceMetrics,
  type AnalysisSnapshot,
} from "@/lib/intelligence/metrics";

export function IntelligenceSummary({
  history,
}: {
  history: AnalysisSnapshot[];
}) {
  const tDetail = useTranslations("dashboardDetail");
  const metrics = computeIntelligenceMetrics(history);

  if (history.length === 0) {
    return (
      <div className="card text-sm text-aistroyka-text-secondary">
        {tDetail("noCompletedAnalysesIntelligence")}
      </div>
    );
  }

  if (!metrics.hasEnoughHistory) {
    return (
      <div className="card text-sm">
        <div className="font-semibold text-aistroyka-text-primary">{tDetail("projectIntelligence")}</div>
        <p className="mt-2 text-aistroyka-warning">{tDetail("insufficientHistory")}</p>
        <p className="mt-2 text-aistroyka-text-secondary">
          {tDetail("current")}: {metrics.current?.stage ?? "—"} · {metrics.current?.completion_percent ?? 0}% · {tDetail("risk")}: {metrics.current?.risk_level ?? "—"}
        </p>
        <p className="mt-2 text-xs text-aistroyka-text-tertiary">{tDetail("addMoreAnalysisForTrends")}</p>
      </div>
    );
  }

  const velocityStr =
    metrics.velocity != null
      ? `${metrics.velocity >= 0 ? "+" : ""}${metrics.velocity.toFixed(1)}%/day`
      : "—";
  const riskTrendSymbol =
    metrics.riskTrend === "up" ? "↑" : metrics.riskTrend === "down" ? "↓" : "→";

  return (
    <div className="card text-sm">
      <div className="font-semibold text-aistroyka-text-primary">{tDetail("projectIntelligence")}</div>
      <div className="mt-3 grid gap-x-4 gap-y-1 text-aistroyka-text-primary sm:grid-cols-2">
        <div><span className="text-aistroyka-text-tertiary">{tDetail("currentStage")}:</span> {metrics.current?.stage ?? "—"}</div>
        <div><span className="text-aistroyka-text-tertiary">{tDetail("completion")}:</span> {metrics.current?.completion_percent ?? 0}%</div>
        <div><span className="text-aistroyka-text-tertiary">{tDetail("velocity")}:</span> {velocityStr}</div>
        <div><span className="text-aistroyka-text-tertiary">{tDetail("riskTrend")}:</span> {riskTrendSymbol} {metrics.riskTrend}</div>
      </div>
      {(metrics.regressionDetected || metrics.riskEscalationDetected) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {metrics.regressionDetected && <span className="rounded-card-sm bg-aistroyka-warning/20 px-2 py-0.5 text-aistroyka-warning">{tDetail("regressionDetected")}</span>}
          {metrics.riskEscalationDetected && <span className="rounded-card-sm bg-aistroyka-error/20 px-2 py-0.5 text-aistroyka-error">{tDetail("riskIncreasing")}</span>}
        </div>
      )}
    </div>
  );
}
