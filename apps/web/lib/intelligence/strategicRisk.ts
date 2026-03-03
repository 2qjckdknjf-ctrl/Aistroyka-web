/**
 * Composite deterministic Strategic Risk Engine.
 * Web-side only; no backend changes.
 */

export type RiskLevel = "low" | "medium" | "high";
export type RiskClassification = "Stable" | "Watch" | "Critical";

const BASE_SCORE: Record<RiskLevel, number> = {
  low: 20,
  medium: 50,
  high: 80,
};

const MODIFIER_SLOWDOWN = 15;
const MODIFIER_DELAY_HIGH = 20;
const MODIFIER_CONFIDENCE_LOW = 15;
const MODIFIER_REGRESSION = 10;
const MODIFIER_LOGICAL = 10;

const STABLE_MAX = 39;
const WATCH_MAX = 69;

export interface StrategicRiskInputs {
  riskLevel: RiskLevel;
  slowdownTrend: boolean;
  delayProbabilityHigh: boolean;
  confidenceBelow60: boolean;
  regressionAnomaly: boolean;
  logicalInconsistency: boolean;
}

export interface StrategicRiskResult {
  /** 0–100 */
  strategicRiskIndex: number;
  classification: RiskClassification;
  /** Human-readable active drivers */
  activeDrivers: string[];
}

const DRIVER_SLOWDOWN = "Slowdown trend";
const DRIVER_DELAY_HIGH = "High delay probability";
const DRIVER_LOW_CONFIDENCE = "Low confidence";
const DRIVER_REGRESSION = "Regression anomaly";
const DRIVER_LOGICAL = "Logical inconsistency";

/**
 * Compute strategic risk index (0–100), classification, and active drivers.
 */
export function computeStrategicRisk(
  inputs: StrategicRiskInputs
): StrategicRiskResult {
  let index = BASE_SCORE[inputs.riskLevel];

  const drivers: string[] = [];

  if (inputs.slowdownTrend) {
    index += MODIFIER_SLOWDOWN;
    drivers.push(DRIVER_SLOWDOWN);
  }
  if (inputs.delayProbabilityHigh) {
    index += MODIFIER_DELAY_HIGH;
    drivers.push(DRIVER_DELAY_HIGH);
  }
  if (inputs.confidenceBelow60) {
    index += MODIFIER_CONFIDENCE_LOW;
    drivers.push(DRIVER_LOW_CONFIDENCE);
  }
  if (inputs.regressionAnomaly) {
    index += MODIFIER_REGRESSION;
    drivers.push(DRIVER_REGRESSION);
  }
  if (inputs.logicalInconsistency) {
    index += MODIFIER_LOGICAL;
    drivers.push(DRIVER_LOGICAL);
  }

  index = Math.max(0, Math.min(100, index));

  let classification: RiskClassification = "Critical";
  if (index <= STABLE_MAX) classification = "Stable";
  else if (index <= WATCH_MAX) classification = "Watch";

  return {
    strategicRiskIndex: index,
    classification,
    activeDrivers: drivers,
  };
}
