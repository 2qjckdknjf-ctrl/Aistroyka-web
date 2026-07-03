import type { BlockerSeverity, RomaQualityDashboard } from "./roma-quality-dashboard.types";

export type ReleaseDecision = "ready" | "not_ready" | "ready_with_warnings";

export type ConfidenceLevel = "high" | "medium" | "low";

export type EngineeringIssue = {
  id: string;
  whatHappened: string;
  whyItHappened: string;
  affectedComponents: string[];
  userImpact: string;
  businessImpact: string;
  releaseImpact: string;
  severity: BlockerSeverity;
  confidence: ConfidenceLevel;
  recommendedAction: string;
  recheckConditions: string;
  evidence: string;
};

export type RomaEngineeringIntelligence = {
  engineeringAssessment: string;
  releaseDecision: ReleaseDecision;
  releaseDecisionLabel: string;
  riskAnalysis: string;
  businessImpact: string;
  actionPlan: string[];
  confidenceScore: ConfidenceLevel;
  confidencePercent: number | null;
  engineeringSummary: string;
  topRisks: EngineeringIssue[];
  recommendations: string[];
  reasoning: string[];
};
