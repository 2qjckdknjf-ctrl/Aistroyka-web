/**
 * Step 9 — Safe manager-facing operational context (no internal diagnostics leakage).
 * Grounded only in fields already returned to the client via intelligence API.
 */

export type ManagerIntelligenceOperationalState =
  | "healthy"
  | "partial_data"
  | "insufficient_data"
  | "low_confidence_health";

export interface ManagerOperationalContext {
  state: ManagerIntelligenceOperationalState;
  /** Short label for trust in summaries */
  trust_band: "high" | "medium" | "low";
  trust_summary: string;
  disclaimers: string[];
  /** Why the dashboard looks this way (safe bullets) */
  why_bullets: string[];
  /** Grounded next steps from recommendations / missing evidence / risks */
  next_step_hints: string[];
  /** For escalation to operator (same as X-Request-Id) */
  request_id: string;
}

export function buildManagerOperationalContext(params: {
  requestId: string;
  executiveProjectSummary: {
    dataSufficiency?: string;
    missingDataDisclaimer?: string;
    recommendedActions?: string[];
  } | null | undefined;
  projectHealthScore: {
    confidence?: string;
    missingDataDisclaimer?: string;
    factorContributions?: { factor: string; impact: number }[];
  } | null | undefined;
  riskOverview: { high: number; medium: number; low: number };
  recommendations: Array<{ title: string; description?: string | null }>;
  missingEvidenceInsights: Array<{ recommendedAction?: string | null }>;
  topRiskInsights: Array<{ recommendedAction?: string | null }>;
}): ManagerOperationalContext {
  const disclaimers = new Set<string>();
  if (params.executiveProjectSummary?.missingDataDisclaimer) {
    disclaimers.add(params.executiveProjectSummary.missingDataDisclaimer);
  }
  if (params.projectHealthScore?.missingDataDisclaimer) {
    disclaimers.add(params.projectHealthScore.missingDataDisclaimer);
  }

  const suff = params.executiveProjectSummary?.dataSufficiency ?? "sufficient";
  const healthConf = params.projectHealthScore?.confidence ?? "high";

  let state: ManagerIntelligenceOperationalState = "healthy";
  if (suff === "insufficient") state = "insufficient_data";
  else if (suff === "partial") state = "partial_data";
  if (healthConf === "low" && state === "healthy") state = "low_confidence_health";
  if (healthConf === "low" && state === "partial_data") state = "low_confidence_health";

  let trust_band: "high" | "medium" | "low" = "high";
  if (state === "insufficient_data") trust_band = "low";
  else if (state === "partial_data" || state === "low_confidence_health") trust_band = "medium";

  const isThinData = suff === "insufficient" || suff === "partial";
  const trust_summary =
    trust_band === "high"
      ? "Figures reflect current project data; treat as operational input."
      : trust_band === "medium" && state === "low_confidence_health" && !isThinData
        ? "Enough activity is recorded, but the health model is less certain — validate important decisions on site."
        : trust_band === "medium"
          ? "Some inputs are thin or uneven — this is a data-coverage gap, not a product outage. Verify critical calls on the ground."
          : "Very limited activity in the system — scores and summaries are directional only. Add tasks, reports, and evidence to improve reliability.";

  const why_bullets: string[] = [];
  if (suff === "insufficient") {
    why_bullets.push("Few workers, tasks, or reports are recorded for this project.");
  } else if (suff === "partial") {
    why_bullets.push("Reports or evidence are missing in some areas; not every risk is equally visible.");
  }
  if (params.riskOverview.high > 0) {
    why_bullets.push(
      `Risk radar shows ${params.riskOverview.high} high-severity signal(s) in the current window.`
    );
  }
  const negativeFactors = (params.projectHealthScore?.factorContributions ?? [])
    .filter((f) => f.impact < 0)
    .slice(0, 3)
    .map((f) => f.factor);
  if (negativeFactors.length > 0) {
    why_bullets.push(`Health score is pulled down mainly by: ${negativeFactors.join(", ")}.`);
  }
  if (healthConf === "low") {
    why_bullets.push("Health model confidence is low — cross-check with site reality.");
  }

  /** Priority: evidence gaps → ranked risks → system recommendations → executive lines */
  const hints: string[] = [];
  const push = (s: string | null | undefined) => {
    const t = (s ?? "").trim();
    if (t && !hints.includes(t) && hints.length < 6) hints.push(t);
  };
  for (const me of params.missingEvidenceInsights) push(me.recommendedAction);
  for (const tr of params.topRiskInsights) push(tr.recommendedAction);
  for (const r of params.recommendations) push(r.title);
  for (const a of params.executiveProjectSummary?.recommendedActions ?? []) push(a);

  return {
    state,
    trust_band,
    trust_summary,
    disclaimers: [...disclaimers],
    why_bullets: why_bullets.slice(0, 6),
    next_step_hints: hints.slice(0, 6),
    request_id: params.requestId,
  };
}
