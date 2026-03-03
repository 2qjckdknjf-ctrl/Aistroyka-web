/**
 * Deterministic projection layer from analysis history.
 * Velocity, completion forecast, risk trajectory, delay probability.
 * Web-side only; no backend changes.
 */

import type { AnalysisSnapshot, RiskLevel } from "./metrics";

const RISK_NUMERIC: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const MIN_DELTA_DAYS = 1 / (24 * 60); // ~1 minute to avoid division by zero
const DELAY_HIGH_MAX_VELOCITY_RATIO = 0.5;

export type VelocityTrend = "up" | "down" | "stable";
export type RiskTrajectory = "rising" | "falling" | "stable";
export type DelayProbability = "low" | "medium" | "high";

export interface ProjectionResult {
  /** Effective velocity used for forecast (%/day). Null if &lt; 1 interval. */
  effectiveVelocity: number | null;
  /** Last interval velocity (%/day). */
  lastVelocity: number | null;
  /** Average velocity across all intervals (%/day). */
  averageVelocity: number | null;
  /** Max velocity seen in history (%/day). */
  maxVelocity: number | null;
  /** Number of intervals (pairs of consecutive analyses). */
  intervalCount: number;
  /** Current completion (latest snapshot). */
  currentCompletion: number;
  /** Days remaining to 100% (null if velocity &lt;= 0 or no velocity). */
  daysRemaining: number | null;
  /** Estimated completion date (ISO date string). Null if no forecast. */
  forecastDate: string | null;
  /** Velocity trend: last vs average. */
  velocityTrend: VelocityTrend;
  /** Risk trajectory from last 2 analyses. */
  riskTrajectory: RiskTrajectory;
  /** Risk escalating (last 2: risk increased). */
  riskEscalating: boolean;
  /** Slowdown: last velocity &lt; average (when &gt;= 2 intervals). */
  slowdownTrend: boolean;
  /** Delay probability indicator. */
  delayProbability: DelayProbability;
  /** True if we have at least one interval to compute velocity. */
  hasVelocity: boolean;
}

function riskToTrajectory(drift: number): RiskTrajectory {
  return drift > 0 ? "rising" : drift < 0 ? "falling" : "stable";
}

/**
 * Compute projection from ordered analysis history (ascending by created_at).
 * referenceDate: "today" for forecast_date; defaults to current date.
 */
export function computeProjection(
  history: AnalysisSnapshot[],
  referenceDate: Date = new Date()
): ProjectionResult {
  const sorted = [...history].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const currentCompletion =
    sorted.length > 0 ? sorted[sorted.length - 1].completion_percent : 0;
  const intervals: { velocity: number; deltaDays: number }[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const t1 = new Date(a.created_at).getTime();
    const t2 = new Date(b.created_at).getTime();
    const deltaDays = (t2 - t1) / (1000 * 60 * 60 * 24);
    const safeDeltaDays = Math.max(deltaDays, MIN_DELTA_DAYS);
    const deltaCompletion = b.completion_percent - a.completion_percent;
    intervals.push({
      velocity: deltaCompletion / safeDeltaDays,
      deltaDays,
    });
  }

  const intervalCount = intervals.length;
  const lastVelocity =
    intervals.length > 0 ? intervals[intervals.length - 1].velocity : null;
  const averageVelocity =
    intervals.length > 0
      ? intervals.reduce((s, x) => s + x.velocity, 0) / intervals.length
      : null;
  const maxVelocity =
    intervals.length > 0
      ? Math.max(...intervals.map((x) => x.velocity))
      : null;

  const effectiveVelocity =
    intervalCount >= 2 ? averageVelocity : lastVelocity;
  const hasVelocity = effectiveVelocity != null;

  let daysRemaining: number | null = null;
  let forecastDate: string | null = null;
  if (hasVelocity && effectiveVelocity! > 0) {
    const remaining = 100 - currentCompletion;
    if (remaining > 0) {
      daysRemaining = remaining / effectiveVelocity!;
      const d = new Date(referenceDate);
      d.setDate(d.getDate() + Math.round(daysRemaining));
      forecastDate = d.toISOString().slice(0, 10);
    }
  }

  let velocityTrend: VelocityTrend = "stable";
  if (intervalCount >= 2 && lastVelocity != null && averageVelocity != null) {
    if (lastVelocity > averageVelocity) velocityTrend = "up";
    else if (lastVelocity < averageVelocity) velocityTrend = "down";
  }

  let riskTrajectory: RiskTrajectory = "stable";
  let riskEscalating = false;
  if (sorted.length >= 2) {
    const last = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    const drift =
      RISK_NUMERIC[last.risk_level as RiskLevel] -
      RISK_NUMERIC[prev.risk_level as RiskLevel];
    riskTrajectory = riskToTrajectory(drift);
    riskEscalating = drift > 0;
  }

  const slowdownTrend =
    intervalCount >= 2 &&
    lastVelocity != null &&
    averageVelocity != null &&
    lastVelocity < averageVelocity;

  let delayProbability: DelayProbability = "low";
  if (
    averageVelocity != null &&
    maxVelocity != null &&
    maxVelocity > 0 &&
    averageVelocity < maxVelocity * DELAY_HIGH_MAX_VELOCITY_RATIO &&
    riskEscalating
  ) {
    delayProbability = "high";
  } else if (riskEscalating || (averageVelocity != null && maxVelocity != null && maxVelocity > 0 && averageVelocity < maxVelocity * DELAY_HIGH_MAX_VELOCITY_RATIO)) {
    delayProbability = "medium";
  }

  return {
    effectiveVelocity: effectiveVelocity ?? null,
    lastVelocity,
    averageVelocity,
    maxVelocity,
    intervalCount,
    currentCompletion,
    daysRemaining,
    forecastDate,
    velocityTrend,
    riskTrajectory,
    riskEscalating,
    slowdownTrend,
    delayProbability,
    hasVelocity,
  };
}
