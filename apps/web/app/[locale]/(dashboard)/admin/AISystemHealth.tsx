"use client";

import { useTranslations } from "next-intl";
import {
  type CalibrationResult,
  type CalibrationStatus,
} from "@/lib/intelligence/calibration";

function statusClass(s: CalibrationStatus): string {
  return s === "Stable"
    ? "text-aistroyka-success"
    : s === "Monitor"
      ? "text-aistroyka-info"
      : s === "Unstable"
        ? "text-aistroyka-warning"
        : "text-aistroyka-error";
}

export function AISystemHealth({ result }: { result: CalibrationResult | null }) {
  const tDetail = useTranslations("dashboardDetail");
  if (result == null) {
    return (
      <div className="card text-sm text-aistroyka-text-secondary">
        <div className="font-semibold text-aistroyka-text-primary">{tDetail("aiSystemHealth")}</div>
        <p className="mt-2">{tDetail("noAnalysisDataYet")}</p>
      </div>
    );
  }

  const { driftMetrics, stabilityIndex, status } = result;

  return (
    <div className="card text-sm">
      <div className="font-semibold text-aistroyka-text-primary">{tDetail("aiSystemHealth")}</div>
      <div className="mt-3 grid gap-x-4 gap-y-1 text-aistroyka-text-primary sm:grid-cols-2">
        <div><span className="text-aistroyka-text-tertiary">{tDetail("stabilityIndex")}:</span> {stabilityIndex}</div>
        <div><span className="text-aistroyka-text-tertiary">{tDetail("status")}:</span> <span className={statusClass(status)}>{status}</span></div>
      </div>
      <div className="mt-3">
        <span className="text-aistroyka-text-tertiary">{tDetail("driftIndicators")}:</span>
        <ul className="mt-1 list-inside list-disc text-aistroyka-text-secondary">
          <li>{tDetail("avgConfidence")}: {driftMetrics.avgConfidence.toFixed(1)}</li>
          <li>{tDetail("suspicious")}: {driftMetrics.percentSuspicious.toFixed(0)}%</li>
          <li>{tDetail("inconsistent")}: {driftMetrics.percentInconsistent.toFixed(0)}%</li>
          <li>{tDetail("anomalyFrequency")}: {driftMetrics.anomalyFrequency.toFixed(0)}%</li>
          <li>{tDetail("contradictionFrequency")}: {driftMetrics.contradictionFrequency.toFixed(0)}%</li>
        </ul>
        <p className="mt-2 text-xs text-aistroyka-text-tertiary">{tDetail("basedOnLastAnalyses", { count: driftMetrics.sampleSize })}</p>
      </div>
    </div>
  );
}
