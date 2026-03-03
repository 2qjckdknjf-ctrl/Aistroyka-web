/**
 * AI output governance: sanity checks, consistency, confidence score, label.
 * Web-side only; no backend/schema changes.
 */

import type { ValidAnalysisResult } from "@/lib/api/validateAnalysisResult";

export type GovernanceLabel = "valid" | "suspicious" | "inconsistent";

export interface GovernanceResult {
  /** regression_anomaly: Δcompletion < -15% */
  regressionAnomaly: boolean;
  /** jump_anomaly: Δcompletion > +40% in < 1 day */
  jumpAnomaly: boolean;
  /** logical_inconsistency: completion > 90 AND risk_level === high */
  logicalInconsistency: boolean;
  /** no issues but high risk */
  noIssuesButHighRisk: boolean;
  confidenceScore: number;
  label: GovernanceLabel;
}

const REGRESSION_THRESHOLD = -15;
const JUMP_THRESHOLD = 40;
const JUMP_MAX_DAYS = 1;
const COMPLETION_HIGH = 90;
const PENALTY_ANOMALY = 20;
const PENALTY_LOGICAL = 20;
const PENALTY_NO_ISSUES_HIGH_RISK = 10;
const LABEL_VALID_MIN = 80;
const LABEL_SUSPICIOUS_MIN = 50;

export interface CurrentWithTimestamp extends ValidAnalysisResult {
  created_at: string;
}

export interface PreviousSnapshot {
  completion_percent: number;
  created_at: string;
}

/**
 * Compute governance flags, confidence score (0–100), and label from current result and optional previous.
 */
export function computeGovernance(
  current: ValidAnalysisResult & { created_at?: string },
  previous: PreviousSnapshot | null
): GovernanceResult {
  let score = 100;
  let regressionAnomaly = false;
  let jumpAnomaly = false;
  let logicalInconsistency = false;
  let noIssuesButHighRisk = false;

  if (current.completion_percent > COMPLETION_HIGH && current.risk_level === "high") {
    logicalInconsistency = true;
    score -= PENALTY_LOGICAL;
  }

  if (
    current.risk_level === "high" &&
    (!current.detected_issues || current.detected_issues.length === 0)
  ) {
    noIssuesButHighRisk = true;
    score -= PENALTY_NO_ISSUES_HIGH_RISK;
  }

  if (previous && typeof current.created_at === "string") {
    const deltaCompletion = current.completion_percent - previous.completion_percent;
    const t1 = new Date(previous.created_at).getTime();
    const t2 = new Date(current.created_at).getTime();
    const deltaTimeDays = (t2 - t1) / (1000 * 60 * 60 * 24);

    if (deltaCompletion < REGRESSION_THRESHOLD) {
      regressionAnomaly = true;
      score -= PENALTY_ANOMALY;
    }
    if (deltaCompletion > JUMP_THRESHOLD && deltaTimeDays < JUMP_MAX_DAYS) {
      jumpAnomaly = true;
      score -= PENALTY_ANOMALY;
    }
  }

  score = Math.max(0, Math.min(100, score));

  let label: GovernanceLabel = "valid";
  if (score < LABEL_SUSPICIOUS_MIN) label = "inconsistent";
  else if (score < LABEL_VALID_MIN) label = "suspicious";

  return {
    regressionAnomaly,
    jumpAnomaly,
    logicalInconsistency,
    noIssuesButHighRisk,
    confidenceScore: score,
    label,
  };
}

export function getGovernanceLabelDisplay(label: GovernanceLabel): string {
  return label === "valid" ? "VALID" : label === "suspicious" ? "SUSPICIOUS" : "INCONSISTENT";
}
