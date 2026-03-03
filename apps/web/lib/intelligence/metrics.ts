/**
 * Construction intelligence metrics from ordered analysis history.
 * Web-side only; uses existing analysis history data.
 */

export type RiskLevel = "low" | "medium" | "high";

export interface AnalysisSnapshot {
  created_at: string;
  stage: string | null;
  completion_percent: number;
  risk_level: RiskLevel;
}

const RISK_NUMERIC: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export interface IntelligenceMetrics {
  /** Latest analysis in history */
  current: AnalysisSnapshot | null;
  /** Completion delta (current - previous); null if < 2 */
  completionDelta: number | null;
  /** Velocity: completion delta per day; null if < 2 or Δtime = 0 */
  velocity: number | null;
  /** Risk drift (current - previous numeric); null if < 2 */
  riskDrift: number | null;
  /** Risk trend: "up" | "down" | "stable" */
  riskTrend: "up" | "down" | "stable";
  /** True if completion went down (current - previous < 0) */
  regressionDetected: boolean;
  /** True if risk increased (drift > 0) */
  riskEscalationDetected: boolean;
  /** True if we have at least 2 analyses to show deltas/velocity */
  hasEnoughHistory: boolean;
}

/**
 * Compute intelligence metrics from ordered history (ascending by created_at).
 */
export function computeIntelligenceMetrics(
  history: AnalysisSnapshot[]
): IntelligenceMetrics {
  const sorted = [...history].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const current = sorted.length > 0 ? sorted[sorted.length - 1] : null;
  const previous =
    sorted.length >= 2 ? sorted[sorted.length - 2] : null;
  const hasEnoughHistory = sorted.length >= 2;

  let completionDelta: number | null = null;
  let velocity: number | null = null;
  let riskDrift: number | null = null;
  let riskTrend: "up" | "down" | "stable" = "stable";
  let regressionDetected = false;
  let riskEscalationDetected = false;

  if (current && previous && hasEnoughHistory) {
    completionDelta = current.completion_percent - previous.completion_percent;
    const t1 = new Date(previous.created_at).getTime();
    const t2 = new Date(current.created_at).getTime();
    const deltaTimeDays = (t2 - t1) / (1000 * 60 * 60 * 24);
    if (deltaTimeDays > 0) {
      velocity = completionDelta / deltaTimeDays;
    }
    riskDrift =
      RISK_NUMERIC[current.risk_level] - RISK_NUMERIC[previous.risk_level];
    riskTrend =
      riskDrift > 0 ? "up" : riskDrift < 0 ? "down" : "stable";
    regressionDetected = completionDelta < 0;
    riskEscalationDetected = riskDrift > 0;
  }

  return {
    current,
    completionDelta,
    velocity,
    riskDrift,
    riskTrend,
    regressionDetected,
    riskEscalationDetected,
    hasEnoughHistory,
  };
}
