/**
 * Phase 7 — Typed intelligence output contracts.
 * All outputs include confidence, explanation, evidence references.
 */

export type SignalSeverity = "low" | "medium" | "high";
export type ConfidenceLevel = "high" | "medium" | "low" | "heuristic";
export type DataSufficiency = "sufficient" | "partial" | "insufficient";

export interface EvidenceReference {
  resourceType: string;
  resourceId: string;
}

export interface MissingEvidenceInsight {
  id: string;
  projectId: string;
  type: "task" | "report" | "before_after" | "stale";
  severity: SignalSeverity;
  title: string;
  explanation: string;
  evidenceReferences: EvidenceReference[];
  confidence: ConfidenceLevel;
  contributingFactors: string[];
  recommendedAction: string;
  missingDataDisclaimer?: string;
  at: string;
}

export interface TopRiskInsight {
  id: string;
  projectId: string;
  rank: number;
  severity: SignalSeverity;
  title: string;
  description: string;
  source: "explicit" | "inferred";
  explanation: string;
  evidenceReferences: EvidenceReference[];
  confidence: ConfidenceLevel;
  contributingFactors: string[];
  recommendedAction: string;
  missingDataDisclaimer?: string;
  at: string;
}

export interface ExecutiveProjectSummary {
  projectId: string;
  tenantId: string;
  at: string;
  headline: string;
  summary: string;
  healthLabel: "healthy" | "moderate" | "unstable" | "critical";
  healthScore: number;
  recentProgress: string[];
  atRisk: string[];
  missingEvidence: string[];
  requiresAttention: string[];
  topRisks: string[];
  recommendedActions: string[];
  metrics: { label: string; value: string }[];
  dataSufficiency: DataSufficiency;
  missingDataDisclaimer?: string;
}

export interface ProjectHealthScore {
  projectId: string;
  tenantId: string;
  at: string;
  score: number;
  label: "healthy" | "moderate" | "unstable" | "critical";
  factorContributions: {
    factor: string;
    impact: number;
    explanation: string;
  }[];
  blockers: string[];
  missingData: string[];
  delayIndicators: string[];
  confidence: "high" | "medium" | "low";
  missingDataDisclaimer?: string;
}
