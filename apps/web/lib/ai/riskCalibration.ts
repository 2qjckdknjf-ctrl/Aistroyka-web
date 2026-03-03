/**
 * Deterministic risk calibration: elevate risk_level when detected_issues
 * suggest safety or critical quality concerns. Conservative bias — prefer
 * not to under-report risk.
 */

import type { AnalysisResult, RiskLevel } from "./types";

const CRITICAL_ISSUE_PATTERNS = [
  /\bsafety\b/i,
  /\bhazard\b/i,
  /\bcollapse\b/i,
  /\bstructural\b/i,
  /\bexposed\s*rebar\b/i,
  /\bunsupported\b/i,
  /\bunstable\b/i,
  /\bfire\b/i,
  /\belectrical\s*danger\b/i,
  /\bcollapse\s*risk\b/i,
  /\bintegrity\s*(at\s*)?risk\b/i,
] as const;

const ISSUES_COUNT_THRESHOLD_FOR_MEDIUM = 3;

function hasCriticalIssueKeyword(issues: string[]): boolean {
  const text = issues.join(" ").toLowerCase();
  return CRITICAL_ISSUE_PATTERNS.some((re) => re.test(text));
}

/**
 * Optionally elevate risk_level based on issues. Does not downgrade.
 * - low + (≥3 issues or critical keyword) → medium
 * - medium + critical keyword → high
 */
export function calibrateRiskLevel(result: AnalysisResult): RiskLevel {
  const { risk_level, detected_issues } = result;
  const issues = Array.isArray(detected_issues) ? detected_issues : [];
  const critical = hasCriticalIssueKeyword(issues);
  const manyIssues = issues.length >= ISSUES_COUNT_THRESHOLD_FOR_MEDIUM;

  if (risk_level === "high") return "high";
  if (risk_level === "medium" && critical) return "high";
  if (risk_level === "low" && (critical || manyIssues)) return "medium";
  return risk_level;
}
