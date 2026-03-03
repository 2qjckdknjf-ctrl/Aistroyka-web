/**
 * Deterministic AI drift monitoring and model stability.
 * Web-only; no backend changes.
 */

import { validateAnalysisResult } from "@/lib/api/validateAnalysisResult";
import { computeGovernance } from "@/lib/intelligence/governance";

const DEFAULT_N = 10;
const SUSPICIOUS_THRESHOLD = 30;
const INCONSISTENT_THRESHOLD = 20;
const ANOMALY_FREQUENCY_THRESHOLD = 30;
const AVG_CONFIDENCE_THRESHOLD = 70;

const PENALTY_SUSPICIOUS = 20;
const PENALTY_INCONSISTENT = 20;
const PENALTY_ANOMALY_FREQ = 15;
const PENALTY_CONTRADICTIONS = 15;
const PENALTY_LOW_CONFIDENCE = 10;

const STABLE_MIN = 80;
const MONITOR_MIN = 60;
const UNSTABLE_MIN = 40;

export type CalibrationStatus =
  | "Stable"
  | "Monitor"
  | "Unstable"
  | "Model Degrading";

export interface DriftMetrics {
  /** Average governance confidence over last N analyses */
  avgConfidence: number;
  /** % of last N with label "suspicious" */
  percentSuspicious: number;
  /** % of last N with label "inconsistent" */
  percentInconsistent: number;
  /** % of last N with at least one anomaly (regression, jump, logical, noIssuesButHighRisk) */
  anomalyFrequency: number;
  /** % of last N with logical_inconsistency (contradiction) */
  contradictionFrequency: number;
  /** Number of analyses used (may be < N if insufficient history) */
  sampleSize: number;
}

export interface CalibrationResult {
  driftMetrics: DriftMetrics;
  /** 0–100 */
  stabilityIndex: number;
  status: CalibrationStatus;
}

/** Analysis row shape sufficient for governance (project page or admin fetch) */
export interface AnalysisForCalibration {
  stage: string | null;
  completion_percent: number;
  risk_level: string;
  detected_issues: string[] | null;
  recommendations: string[] | null;
  created_at: string;
}

/**
 * Compute drift metrics from last N analyses (ordered by created_at ascending).
 * Each analysis is evaluated with its immediate predecessor as "previous".
 */
export function computeDriftMetrics(
  analyses: AnalysisForCalibration[],
  N: number = DEFAULT_N
): DriftMetrics {
  const sorted = [...analyses].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  if (sorted.length < 2) {
    return {
      avgConfidence: 100,
      percentSuspicious: 0,
      percentInconsistent: 0,
      anomalyFrequency: 0,
      contradictionFrequency: 0,
      sampleSize: 0,
    };
  }

  const start = Math.max(1, sorted.length - N);
  const slice = sorted.slice(start);
  let sumConfidence = 0;
  let suspiciousCount = 0;
  let inconsistentCount = 0;
  let anomalyCount = 0;
  let contradictionCount = 0;

  for (let i = 0; i < slice.length; i++) {
    const current = slice[i];
    const prevIdx = start + i - 1;
    const previous =
      prevIdx >= 0
        ? {
            completion_percent: sorted[prevIdx].completion_percent,
            created_at: sorted[prevIdx].created_at,
          }
        : null;

    const validation = validateAnalysisResult({
      stage: current.stage ?? "",
      completion_percent: current.completion_percent,
      risk_level: current.risk_level as "low" | "medium" | "high",
      detected_issues: current.detected_issues ?? [],
      recommendations: current.recommendations ?? [],
    });
    if (!validation.success) {
      sumConfidence += 0;
      inconsistentCount += 1;
      anomalyCount += 1;
      contradictionCount += 1;
      continue;
    }
    const gov = computeGovernance(
      { ...validation.data, created_at: current.created_at },
      previous
    );
    sumConfidence += gov.confidenceScore;
    if (gov.label === "suspicious") suspiciousCount += 1;
    if (gov.label === "inconsistent") inconsistentCount += 1;
    const hasAnomaly =
      gov.regressionAnomaly ||
      gov.jumpAnomaly ||
      gov.logicalInconsistency ||
      gov.noIssuesButHighRisk;
    if (hasAnomaly) anomalyCount += 1;
    if (gov.logicalInconsistency) contradictionCount += 1;
  }

  const n = slice.length;
  return {
    avgConfidence: n > 0 ? sumConfidence / n : 100,
    percentSuspicious: n > 0 ? (suspiciousCount / n) * 100 : 0,
    percentInconsistent: n > 0 ? (inconsistentCount / n) * 100 : 0,
    anomalyFrequency: n > 0 ? (anomalyCount / n) * 100 : 0,
    contradictionFrequency: n > 0 ? (contradictionCount / n) * 100 : 0,
    sampleSize: n,
  };
}

/**
 * Compute model stability index (0–100) and calibration status from drift metrics.
 */
export function computeStabilityIndex(metrics: DriftMetrics): CalibrationResult {
  let index = 100;
  if (metrics.percentSuspicious > SUSPICIOUS_THRESHOLD)
    index -= PENALTY_SUSPICIOUS;
  if (metrics.percentInconsistent > INCONSISTENT_THRESHOLD)
    index -= PENALTY_INCONSISTENT;
  if (metrics.anomalyFrequency > ANOMALY_FREQUENCY_THRESHOLD)
    index -= PENALTY_ANOMALY_FREQ;
  if (metrics.contradictionFrequency > 0) index -= PENALTY_CONTRADICTIONS;
  if (metrics.avgConfidence < AVG_CONFIDENCE_THRESHOLD)
    index -= PENALTY_LOW_CONFIDENCE;
  index = Math.max(0, Math.min(100, Math.round(index)));

  let status: CalibrationStatus = "Model Degrading";
  if (index >= STABLE_MIN) status = "Stable";
  else if (index >= MONITOR_MIN) status = "Monitor";
  else if (index >= UNSTABLE_MIN) status = "Unstable";

  return {
    driftMetrics: metrics,
    stabilityIndex: index,
    status,
  };
}

/**
 * Full calibration from analysis list: drift metrics + stability index + status.
 */
export function computeCalibration(
  analyses: AnalysisForCalibration[],
  N: number = DEFAULT_N
): CalibrationResult {
  const metrics = computeDriftMetrics(analyses, N);
  return computeStabilityIndex(metrics);
}
