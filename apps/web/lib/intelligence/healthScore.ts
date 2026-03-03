/**
 * Executive-level Construction Health Score.
 * Web-only; no backend changes.
 */

export type HealthClassification = "Healthy" | "Moderate" | "Unstable" | "Critical";

const RISK_WEIGHT = 0.5;
const CONFIDENCE_WEIGHT = 0.3;
const PENALTY_DELAY_HIGH = 10;
const PENALTY_SLOWDOWN = 10;
const PENALTY_PER_ANOMALY = 5;
const ANOMALY_CAP = 15;

const HEALTHY_MIN = 80;
const MODERATE_MIN = 60;
const UNSTABLE_MIN = 40;

export interface HealthScoreInputs {
  strategicRiskIndex: number;
  confidenceScore: number;
  delayProbabilityHigh: boolean;
  slowdownTrend: boolean;
  /** Number of anomaly flags (regression, jump, logical); penalty 5 each, max 15 */
  anomalyFlagCount: number;
}

export interface HealthScoreResult {
  /** 0–100 */
  healthScore: number;
  classification: HealthClassification;
  /** Deterministic 1–2 sentence executive summary */
  executiveSummary: string;
}

/**
 * Compute health score (0–100), classification, and executive summary.
 */
export function computeHealthScore(
  inputs: HealthScoreInputs
): HealthScoreResult {
  let score = 100;
  score -= inputs.strategicRiskIndex * RISK_WEIGHT;
  score -= (100 - inputs.confidenceScore) * CONFIDENCE_WEIGHT;
  if (inputs.delayProbabilityHigh) score -= PENALTY_DELAY_HIGH;
  if (inputs.slowdownTrend) score -= PENALTY_SLOWDOWN;
  const anomalyPenalty = Math.min(
    inputs.anomalyFlagCount * PENALTY_PER_ANOMALY,
    ANOMALY_CAP
  );
  score -= anomalyPenalty;
  score = Math.max(0, Math.min(100, Math.round(score)));

  let classification: HealthClassification = "Critical";
  if (score >= HEALTHY_MIN) classification = "Healthy";
  else if (score >= MODERATE_MIN) classification = "Moderate";
  else if (score >= UNSTABLE_MIN) classification = "Unstable";

  const summary = buildExecutiveSummary({
    healthClassification: classification,
    riskLevel: inputs.strategicRiskIndex,
    delayProbabilityHigh: inputs.delayProbabilityHigh,
    slowdownTrend: inputs.slowdownTrend,
  });

  return {
    healthScore: score,
    classification,
    executiveSummary: summary,
  };
}

interface SummaryInputs {
  healthClassification: HealthClassification;
  riskLevel: number;
  delayProbabilityHigh: boolean;
  slowdownTrend: boolean;
}

function buildExecutiveSummary(inputs: SummaryInputs): string {
  const { healthClassification, riskLevel, delayProbabilityHigh, slowdownTrend } =
    inputs;

  if (healthClassification === "Healthy") {
    if (!slowdownTrend && !delayProbabilityHigh)
      return "Construction health is strong. No significant risk or delay signals.";
    if (slowdownTrend)
      return "Construction health is good. Monitor progress; velocity has slowed recently.";
    return "Construction health is good. Some delay probability; continue monitoring.";
  }

  if (healthClassification === "Moderate") {
    const parts: string[] = [];
    parts.push("Construction health is moderate.");
    if (riskLevel >= 50) parts.push("Elevated risk level.");
    if (delayProbabilityHigh) parts.push("High delay probability.");
    if (slowdownTrend) parts.push("Progress is slowing.");
    if (parts.length === 1) parts.push("Review trends and mitigate risks.");
    return parts.join(" ");
  }

  if (healthClassification === "Unstable") {
    const parts: string[] = ["Construction health is unstable."];
    if (delayProbabilityHigh) parts.push("High delay probability.");
    if (slowdownTrend) parts.push("Slowdown trend detected.");
    parts.push("Action recommended.");
    return parts.join(" ");
  }

  // Critical
  const parts: string[] = ["Construction health is critical."];
  if (delayProbabilityHigh) parts.push("High delay probability.");
  if (slowdownTrend) parts.push("Progress slowdown.");
  parts.push("Urgent attention required.");
  return parts.join(" ");
}
