/**
 * Phase 8 — Safe operational metadata for intelligence responses (no raw narrative).
 */

import type { ExecutiveProjectSummary, ProjectHealthScore } from "@/lib/ai-brain/domain/intelligence-output.types";

export interface IntelligenceDiagnosticsPayload {
  data_sufficiency?: string;
  executive_health_label?: string;
  health_score?: number;
  health_label?: string;
  health_confidence?: string;
  /** Factor keys only (e.g. reporting, evidence) — not explanations */
  health_factor_keys: string[];
  risk_counts?: { high: number; medium: number; low: number };
  missing_evidence_insight_count: number;
  top_risk_insight_count: number;
  manager_insight_count: number;
  missing_data_disclaimer: boolean;
  degradation_reason_codes: string[];
}

export function buildIntelligenceDiagnosticsPayload(params: {
  executiveProjectSummary: ExecutiveProjectSummary | null | undefined;
  projectHealthScore: ProjectHealthScore | null | undefined;
  riskOverview?: { high: number; medium: number; low: number } | null;
  missingEvidenceInsightsCount: number;
  topRiskInsightsCount: number;
  managerInsightsCount: number;
}): IntelligenceDiagnosticsPayload {
  const exec = params.executiveProjectSummary;
  const health = params.projectHealthScore;
  const ro = params.riskOverview;

  const degradation: string[] = [];
  if (exec?.dataSufficiency === "insufficient") degradation.push("executive_data_insufficient");
  if (exec?.dataSufficiency === "partial") degradation.push("executive_data_partial");
  if (health?.confidence === "low") {
    degradation.push("health_confidence_low");
  }
  if (params.missingEvidenceInsightsCount > 0) degradation.push("missing_evidence_signals");
  if ((ro?.high ?? 0) > 0) degradation.push("high_risk_present");

  return {
    data_sufficiency: exec?.dataSufficiency,
    executive_health_label: exec?.healthLabel,
    health_score: health?.score ?? exec?.healthScore,
    health_label: health?.label,
    health_confidence: health?.confidence,
    health_factor_keys: (health?.factorContributions ?? []).map((f) => f.factor).slice(0, 12),
    risk_counts: ro ? { high: ro.high, medium: ro.medium, low: ro.low } : undefined,
    missing_evidence_insight_count: params.missingEvidenceInsightsCount,
    top_risk_insight_count: params.topRiskInsightsCount,
    manager_insight_count: params.managerInsightsCount,
    missing_data_disclaimer: !!(exec?.missingDataDisclaimer || health?.missingDataDisclaimer),
    degradation_reason_codes: degradation,
  };
}
