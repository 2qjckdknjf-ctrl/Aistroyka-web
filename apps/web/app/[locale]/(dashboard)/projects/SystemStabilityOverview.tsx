"use client";

import { useTranslations } from "next-intl";
import { computeCrossAnalysis } from "@/lib/intelligence/crossAnalysis";
import type { AnalysisSnapshot } from "@/lib/intelligence/metrics";

function statusLabel(flag: boolean, tDetail: (key: string) => string): string {
  return flag ? tDetail("flagged") : tDetail("stable");
}

function statusClass(flag: boolean): string {
  return flag ? "text-aistroyka-warning" : "text-aistroyka-text-primary";
}

export function SystemStabilityOverview({
  history,
}: {
  history: AnalysisSnapshot[];
}) {
  const tDetail = useTranslations("dashboardDetail");
  if (history.length === 0) {
    return (
      <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-4 text-sm text-aistroyka-text-secondary sm:p-6">
        {tDetail("systemStabilityOverviewEmpty")}
      </div>
    );
  }

  const result = computeCrossAnalysis(history);

  return (
    <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-4 text-sm sm:p-6">
      <div className="font-medium text-aistroyka-text-primary">{tDetail("systemStabilityOverview")}</div>
      <div className="mt-4 grid gap-2 text-aistroyka-text-primary sm:grid-cols-2">
        <div>
          <span className="text-aistroyka-text-tertiary">{tDetail("stageStability")}:</span>{" "}
          <span className={statusClass(result.stageInstability)}>
            {statusLabel(result.stageInstability, tDetail)}
          </span>
        </div>
        <div>
          <span className="text-aistroyka-text-tertiary">{tDetail("progressStability")}:</span>{" "}
          <span className={statusClass(result.unstableProgress)}>
            {statusLabel(result.unstableProgress, tDetail)}
          </span>
        </div>
        <div>
          <span className="text-aistroyka-text-tertiary">{tDetail("structuralRisk")}:</span>{" "}
          <span className={statusClass(result.structuralHighRisk)}>
            {result.structuralHighRisk ? tDetail("highRisk") : tDetail("normal")}
          </span>
        </div>
        <div>
          <span className="text-aistroyka-text-tertiary">{tDetail("outlier")}:</span>{" "}
          <span className={statusClass(result.hasOutlier)}>
            {result.hasOutlier
              ? result.outlierDescription ?? tDetail("detected")
              : tDetail("none")}
          </span>
        </div>
      </div>
    </div>
  );
}
