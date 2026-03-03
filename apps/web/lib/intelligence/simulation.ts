/**
 * Deterministic decision scenario simulation.
 * Baseline, Acceleration (+20% velocity), Degradation (-30% velocity + risk escalation).
 * Web-only; no backend changes.
 */

const ACCELERATION_VELOCITY_FACTOR = 1.2;
const DEGRADATION_VELOCITY_FACTOR = 0.7;
const ACCELERATION_RISK_DELTA = -10;
const DEGRADATION_RISK_DELTA = 15;
const ACCELERATION_HEALTH_DELTA = 10;
const DEGRADATION_HEALTH_DELTA = -15;

export type ScenarioId = "baseline" | "acceleration" | "degradation";

export interface ScenarioProjection {
  scenarioId: ScenarioId;
  label: string;
  /** Projected completion date (ISO date string) or null */
  projectedCompletionDate: string | null;
  /** Days to completion (from reference date) or null */
  daysToCompletion: number | null;
  projectedStrategicRiskIndex: number;
  projectedHealthScore: number;
  /** Delay probability label */
  delayProbabilityLabel: string;
}

export interface SimulationInputs {
  currentCompletion: number;
  effectiveVelocity: number | null;
  currentStrategicRiskIndex: number;
  currentHealthScore: number;
  currentDelayProbabilityHigh: boolean;
  referenceDate: Date;
}

export interface SimulationResult {
  baseline: ScenarioProjection;
  acceleration: ScenarioProjection;
  degradation: ScenarioProjection;
  /** Delta days vs baseline (negative = earlier, positive = later) */
  deltaDaysAcceleration: number | null;
  deltaDaysDegradation: number | null;
  /** Delta health vs baseline */
  deltaHealthAcceleration: number;
  deltaHealthDegradation: number;
  /** Delta risk vs baseline */
  deltaRiskAcceleration: number;
  deltaRiskDegradation: number;
}

/**
 * Compute projected completion date from velocity and remaining completion.
 * Returns null if velocity <= 0 or remaining <= 0.
 */
function projectCompletionDate(
  currentCompletion: number,
  velocity: number,
  referenceDate: Date
): { date: string | null; days: number | null } {
  if (velocity <= 0) return { date: null, days: null };
  const remaining = 100 - currentCompletion;
  if (remaining <= 0) return { date: referenceDate.toISOString().slice(0, 10), days: 0 };
  const days = remaining / velocity;
  const d = new Date(referenceDate);
  d.setDate(d.getDate() + Math.round(days));
  return { date: d.toISOString().slice(0, 10), days };
}

/**
 * Run deterministic scenario simulation.
 * Baseline = current; Acceleration = +20% velocity, lower risk, higher health;
 * Degradation = -30% velocity, risk escalation, lower health.
 */
export function runSimulation(inputs: SimulationInputs): SimulationResult {
  const v = inputs.effectiveVelocity ?? 0;
  const baseProj = projectCompletionDate(
    inputs.currentCompletion,
    v,
    inputs.referenceDate
  );
  const baseline: ScenarioProjection = {
    scenarioId: "baseline",
    label: "Baseline",
    projectedCompletionDate: baseProj.date,
    daysToCompletion: baseProj.days,
    projectedStrategicRiskIndex: inputs.currentStrategicRiskIndex,
    projectedHealthScore: inputs.currentHealthScore,
    delayProbabilityLabel: inputs.currentDelayProbabilityHigh ? "high" : "low",
  };

  const vAccel = v * ACCELERATION_VELOCITY_FACTOR;
  const accelProj = projectCompletionDate(
    inputs.currentCompletion,
    vAccel,
    inputs.referenceDate
  );
  const acceleration: ScenarioProjection = {
    scenarioId: "acceleration",
    label: "Acceleration",
    projectedCompletionDate: accelProj.date,
    daysToCompletion: accelProj.days,
    projectedStrategicRiskIndex: Math.max(
      0,
      Math.min(100, inputs.currentStrategicRiskIndex + ACCELERATION_RISK_DELTA)
    ),
    projectedHealthScore: Math.max(
      0,
      Math.min(100, inputs.currentHealthScore + ACCELERATION_HEALTH_DELTA)
    ),
    delayProbabilityLabel: "low",
  };

  const vDeg = v * DEGRADATION_VELOCITY_FACTOR;
  const degProj = projectCompletionDate(
    inputs.currentCompletion,
    vDeg > 0 ? vDeg : v * 0.01,
    inputs.referenceDate
  );
  const degradation: ScenarioProjection = {
    scenarioId: "degradation",
    label: "Degradation",
    projectedCompletionDate: degProj.date,
    daysToCompletion: degProj.days,
    projectedStrategicRiskIndex: Math.max(
      0,
      Math.min(100, inputs.currentStrategicRiskIndex + DEGRADATION_RISK_DELTA)
    ),
    projectedHealthScore: Math.max(
      0,
      Math.min(100, inputs.currentHealthScore + DEGRADATION_HEALTH_DELTA)
    ),
    delayProbabilityLabel: "high",
  };

  const deltaDaysAcceleration =
    baseProj.days != null && accelProj.days != null
      ? accelProj.days - baseProj.days
      : null;
  const deltaDaysDegradation =
    baseProj.days != null && degProj.days != null
      ? degProj.days - baseProj.days
      : null;

  return {
    baseline,
    acceleration,
    degradation,
    deltaDaysAcceleration,
    deltaDaysDegradation,
    deltaHealthAcceleration: ACCELERATION_HEALTH_DELTA,
    deltaHealthDegradation: DEGRADATION_HEALTH_DELTA,
    deltaRiskAcceleration: ACCELERATION_RISK_DELTA,
    deltaRiskDegradation: DEGRADATION_RISK_DELTA,
  };
}
