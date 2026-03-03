"use client";

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
  if (result == null) {
    return (
      <div className="card text-sm text-aistroyka-text-secondary">
        <div className="font-semibold text-aistroyka-text-primary">AI System Health</div>
        <p className="mt-2">No analysis data yet. Run analyses to see drift metrics.</p>
      </div>
    );
  }

  const { driftMetrics, stabilityIndex, status } = result;

  return (
    <div className="card text-sm">
      <div className="font-semibold text-aistroyka-text-primary">AI System Health</div>
      <div className="mt-3 grid gap-x-4 gap-y-1 text-aistroyka-text-primary sm:grid-cols-2">
        <div><span className="text-aistroyka-text-tertiary">Stability Index:</span> {stabilityIndex}</div>
        <div><span className="text-aistroyka-text-tertiary">Status:</span> <span className={statusClass(status)}>{status}</span></div>
      </div>
      <div className="mt-3">
        <span className="text-aistroyka-text-tertiary">Drift indicators:</span>
        <ul className="mt-1 list-inside list-disc text-aistroyka-text-secondary">
          <li>Avg confidence: {driftMetrics.avgConfidence.toFixed(1)}</li>
          <li>Suspicious: {driftMetrics.percentSuspicious.toFixed(0)}%</li>
          <li>Inconsistent: {driftMetrics.percentInconsistent.toFixed(0)}%</li>
          <li>Anomaly frequency: {driftMetrics.anomalyFrequency.toFixed(0)}%</li>
          <li>Contradiction frequency: {driftMetrics.contradictionFrequency.toFixed(0)}%</li>
        </ul>
        <p className="mt-2 text-xs text-aistroyka-text-tertiary">Based on last {driftMetrics.sampleSize} analyses.</p>
      </div>
    </div>
  );
}
