/**
 * Deterministic cross-analysis intelligence layer.
 * Stage stability, velocity variance, structural risk, outlier detection.
 * Web-only; no backend changes.
 */

import type { AnalysisSnapshot, RiskLevel } from "./metrics";

const MIN_DELTA_DAYS = 1 / (24 * 60);
const VELOCITY_UNSTABLE_RATIO = 2;
const STRUCTURAL_RISK_N = 5;
const STRUCTURAL_RISK_MAJORITY = 0.5;
const OUTLIER_COMPLETION_THRESHOLD = 25;

export interface CrossAnalysisResult {
  /** Last 3 analyses: stage oscillates or changes non-linearly */
  stageInstability: boolean;
  /** max_velocity > 2 * average_velocity */
  unstableProgress: boolean;
  /** >50% of last N analyses are high risk */
  structuralHighRisk: boolean;
  /** At least one analysis deviates strongly in completion or risk */
  hasOutlier: boolean;
  /** Human-readable outlier description if any */
  outlierDescription: string | null;
}

/**
 * Compute cross-analysis flags from ordered history (ascending by created_at).
 */
export function computeCrossAnalysis(
  history: AnalysisSnapshot[]
): CrossAnalysisResult {
  const sorted = [...history].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const n = sorted.length;

  let stageInstability = false;
  if (n >= 3) {
    const s0 = (sorted[n - 3].stage ?? "").trim();
    const s1 = (sorted[n - 2].stage ?? "").trim();
    const s2 = (sorted[n - 1].stage ?? "").trim();
    const oscillates = s0 === s2 && s0 !== "" && s0 !== s1;
    const allDistinct = s0 !== s1 && s1 !== s2 && s0 !== s2 && s0 !== "" && s1 !== "" && s2 !== "";
    stageInstability = oscillates || allDistinct;
  }

  const intervals: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const deltaDays = Math.max(
      (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) /
        (1000 * 60 * 60 * 24),
      MIN_DELTA_DAYS
    );
    intervals.push((b.completion_percent - a.completion_percent) / deltaDays);
  }
  let unstableProgress = false;
  if (intervals.length > 0) {
    const avg = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    const max = Math.max(...intervals);
    unstableProgress = max > VELOCITY_UNSTABLE_RATIO * avg && avg > 0;
  }

  const lastN = sorted.slice(-STRUCTURAL_RISK_N);
  const highRiskCount = lastN.filter(
    (a) => (a.risk_level as RiskLevel) === "high"
  ).length;
  const structuralHighRisk =
    lastN.length > 0 &&
    highRiskCount / lastN.length > STRUCTURAL_RISK_MAJORITY;

  const completionValues = sorted.map((a) => a.completion_percent);
  const medianCompletion = median(completionValues);
  const completionOutlier = completionValues.some(
    (c) => Math.abs(c - medianCompletion) > OUTLIER_COMPLETION_THRESHOLD
  );
  const riskLevels = sorted.map((a) => a.risk_level);
  const highCount = riskLevels.filter((r) => r === "high").length;
  const lowCount = riskLevels.filter((r) => r === "low").length;
  const riskOutlier =
    (highCount === 1 && riskLevels.length > 1) ||
    (lowCount === 1 && riskLevels.length > 1);
  const hasOutlier = completionOutlier || riskOutlier;
  const outlierDescription = hasOutlier
    ? [
        completionOutlier ? "completion" : null,
        riskOutlier ? "risk" : null,
      ]
        .filter(Boolean)
        .join(" + ") || "outlier"
    : null;

  return {
    stageInstability,
    unstableProgress,
    structuralHighRisk,
    hasOutlier,
    outlierDescription,
  };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
