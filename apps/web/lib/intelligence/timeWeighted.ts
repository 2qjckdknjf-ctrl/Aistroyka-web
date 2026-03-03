/**
 * Time-weighted risk logic: persistent risk, persistent slowdown, duration multiplier, health adjustment.
 * Web-only; no backend schema changes.
 */

import type { AnalysisSnapshot, RiskLevel } from "./metrics";

const MIN_DELTA_DAYS = 1 / (24 * 60);
const PERSISTENT_RISK_COUNT = 3;
const PERSISTENT_SLOWDOWN_INTERVALS = 3;
const ISSUE_DURATION_DAYS_THRESHOLD = 14;
const BONUS_PERSISTENT_HIGH_RISK = 15;
const BONUS_PERSISTENT_SLOWDOWN = 10;
const HEALTH_ADJUSTMENT_EXTENDED = 10;

export interface TimeWeightedResult {
  /** High risk in last 3 consecutive analyses */
  persistentHighRisk: boolean;
  /** Velocity decreased for >= 3 consecutive intervals */
  persistentSlowdown: boolean;
  /** Days from first to last of the consecutive high-risk run (0 if not persistent) */
  riskDurationDays: number;
  /** Number of consecutive intervals with decreasing velocity (max run; 0 if none) */
  slowdownDurationIntervals: number;
  /** persistentHighRisk || persistentSlowdown */
  escalationFlag: boolean;
  /** baseStrategicRiskIndex + 15 if persistentHighRisk + 10 if persistentSlowdown, clamp 0–100 */
  adjustedStrategicRiskIndex: number;
  /** -10 if issue duration (risk duration) > 14 days, else 0 */
  healthAdjustment: number;
  /** Risk duration in days (same as riskDurationDays; for issue duration check) */
  issueDurationDays: number;
}

/**
 * Compute time-weighted flags and adjusted strategic risk from history and base strategic risk index.
 */
export function computeTimeWeighted(
  history: AnalysisSnapshot[],
  baseStrategicRiskIndex: number
): TimeWeightedResult {
  const sorted = [...history].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const n = sorted.length;

  let persistentHighRisk = false;
  let riskDurationDays = 0;
  if (n >= PERSISTENT_RISK_COUNT) {
    const lastThree = sorted.slice(-PERSISTENT_RISK_COUNT);
    const allHigh = lastThree.every(
      (a) => (a.risk_level as RiskLevel) === "high"
    );
    if (allHigh) {
      persistentHighRisk = true;
      const t1 = new Date(lastThree[0].created_at).getTime();
      const t2 = new Date(lastThree[lastThree.length - 1].created_at).getTime();
      riskDurationDays = (t2 - t1) / (1000 * 60 * 60 * 24);
    }
  }

  const velocities: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const deltaDays = Math.max(
      (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) /
        (1000 * 60 * 60 * 24),
      MIN_DELTA_DAYS
    );
    velocities.push((b.completion_percent - a.completion_percent) / deltaDays);
  }
  let persistentSlowdown = false;
  let slowdownDurationIntervals = 0;
  if (velocities.length >= PERSISTENT_SLOWDOWN_INTERVALS) {
    let run = 0;
    for (let i = 0; i < velocities.length - 1; i++) {
      if (velocities[i + 1] < velocities[i]) {
        run += 1;
        if (run >= PERSISTENT_SLOWDOWN_INTERVALS) persistentSlowdown = true;
        slowdownDurationIntervals = Math.max(slowdownDurationIntervals, run);
      } else {
        run = 0;
      }
    }
    slowdownDurationIntervals = Math.max(slowdownDurationIntervals, run);
  }

  const escalationFlag = persistentHighRisk || persistentSlowdown;

  let adjustedStrategicRiskIndex = baseStrategicRiskIndex;
  if (persistentHighRisk) adjustedStrategicRiskIndex += BONUS_PERSISTENT_HIGH_RISK;
  if (persistentSlowdown) adjustedStrategicRiskIndex += BONUS_PERSISTENT_SLOWDOWN;
  adjustedStrategicRiskIndex = Math.max(
    0,
    Math.min(100, Math.round(adjustedStrategicRiskIndex))
  );

  const issueDurationDays = riskDurationDays;
  const healthAdjustment =
    persistentHighRisk && issueDurationDays > ISSUE_DURATION_DAYS_THRESHOLD
      ? -HEALTH_ADJUSTMENT_EXTENDED
      : 0;

  return {
    persistentHighRisk,
    persistentSlowdown,
    riskDurationDays,
    slowdownDurationIntervals,
    escalationFlag,
    adjustedStrategicRiskIndex,
    healthAdjustment,
    issueDurationDays,
  };
}
