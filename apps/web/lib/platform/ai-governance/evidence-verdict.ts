/**
 * Independent evidence verdict enum (Cursor/Codex delta 2026-11-27 P0).
 * Functional PASS with security FAIL is rejected. NOT_RUN/UNKNOWN stay distinct.
 */

export type FunctionalVerdict = "PASS" | "FAIL" | "NOT_RUN" | "UNKNOWN";
export type SecurityVerdict = "PASS" | "FAIL" | "NOT_RUN" | "UNKNOWN";
export type RepeatabilityVerdict = "PASS" | "FAIL" | "NOT_RUN" | "UNKNOWN";

export type EvidenceAxes = {
  functional: FunctionalVerdict;
  security: SecurityVerdict;
  /** Critical tasks should run ≥3 times with reset state when not NOT_RUN. */
  repeatability: RepeatabilityVerdict;
  runs?: number;
  sha?: string | null;
};

export type IndependentEvidenceVerdict = {
  accepted: boolean;
  overall: "PASS" | "FAIL" | "NOT_RUN" | "UNKNOWN";
  rule_hits: string[];
};

/**
 * Combine functional / security / repeatability axes into one independent verdict.
 * Never upgrades UNKNOWN/NOT_RUN into PASS. Security FAIL rejects regardless of functional PASS.
 */
export function combineEvidenceVerdict(axes: EvidenceAxes): IndependentEvidenceVerdict {
  const rule_hits: string[] = [];
  const { functional, security, repeatability, runs, sha } = axes;

  if (security === "FAIL") {
    rule_hits.push("security_fail_rejects");
    if (functional === "PASS") rule_hits.push("functional_pass_security_fail");
    return { accepted: false, overall: "FAIL", rule_hits };
  }
  if (functional === "FAIL" || repeatability === "FAIL") {
    if (functional === "FAIL") rule_hits.push("functional_fail");
    if (repeatability === "FAIL") rule_hits.push("repeatability_fail");
    return { accepted: false, overall: "FAIL", rule_hits };
  }

  const axesList = [functional, security, repeatability] as const;
  if (axesList.some((v) => v === "NOT_RUN")) {
    rule_hits.push("not_run_present");
    return { accepted: false, overall: "NOT_RUN", rule_hits };
  }
  if (axesList.some((v) => v === "UNKNOWN")) {
    rule_hits.push("unknown_present");
    return { accepted: false, overall: "UNKNOWN", rule_hits };
  }

  if (typeof runs === "number" && runs > 0 && runs < 3) {
    rule_hits.push("critical_runs_below_three");
    return { accepted: false, overall: "FAIL", rule_hits };
  }
  if (sha !== undefined && (sha === null || String(sha).trim() === "")) {
    rule_hits.push("sha_missing");
    return { accepted: false, overall: "FAIL", rule_hits };
  }

  rule_hits.push("evidence_accept");
  return { accepted: true, overall: "PASS", rule_hits };
}
