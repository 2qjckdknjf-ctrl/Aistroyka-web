"use client";

import { computeCrossAnalysis } from "@/lib/intelligence/crossAnalysis";
import type { AnalysisSnapshot } from "@/lib/intelligence/metrics";

function statusLabel(flag: boolean): string {
  return flag ? "Flagged" : "Stable";
}

function statusClass(flag: boolean): string {
  return flag ? "text-aistroyka-warning" : "text-aistroyka-text-primary";
}

export function SystemStabilityOverview({
  history,
}: {
  history: AnalysisSnapshot[];
}) {
  if (history.length === 0) {
    return (
      <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-4 text-sm text-aistroyka-text-secondary sm:p-6">
        System Stability Overview: No analyses yet. Run analyses to see
        stability indicators.
      </div>
    );
  }

  const result = computeCrossAnalysis(history);

  return (
    <div className="rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-4 text-sm sm:p-6">
      <div className="font-medium text-aistroyka-text-primary">System Stability Overview</div>
      <div className="mt-4 grid gap-2 text-aistroyka-text-primary sm:grid-cols-2">
        <div>
          <span className="text-aistroyka-text-tertiary">Stage Stability:</span>{" "}
          <span className={statusClass(result.stageInstability)}>
            {statusLabel(result.stageInstability)}
          </span>
        </div>
        <div>
          <span className="text-aistroyka-text-tertiary">Progress Stability:</span>{" "}
          <span className={statusClass(result.unstableProgress)}>
            {statusLabel(result.unstableProgress)}
          </span>
        </div>
        <div>
          <span className="text-aistroyka-text-tertiary">Structural Risk:</span>{" "}
          <span className={statusClass(result.structuralHighRisk)}>
            {result.structuralHighRisk ? "High risk" : "Normal"}
          </span>
        </div>
        <div>
          <span className="text-aistroyka-text-tertiary">Outlier:</span>{" "}
          <span className={statusClass(result.hasOutlier)}>
            {result.hasOutlier
              ? result.outlierDescription ?? "Detected"
              : "None"}
          </span>
        </div>
      </div>
    </div>
  );
}
