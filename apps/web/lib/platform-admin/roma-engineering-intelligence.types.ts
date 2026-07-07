import type {
  RomaConfidenceCore,
  RomaImpactStatus,
  RomaReleaseDecision,
} from "@aistroyka/roma-kernel";
import type { BlockerSeverity } from "./roma-quality-dashboard.types";

export type ReleaseDecision = RomaReleaseDecision;
export type ConfidenceLevel = RomaConfidenceCore;
export type ProductAreaStatus = RomaImpactStatus;

export type ProductAreaImpact = {
  id: string;
  label: string;
  status: ProductAreaStatus;
  evidence: string | null;
};

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

export type DecisionReason = {
  title: string;
  component: string;
  severity: BlockerSeverity;
  evidence: string;
  impact: string;
  recommendation: string;
  recheckCondition: string;
};

export type OwnerOperatorSummary = {
  releaseDecisionLabel: string;
  confidenceLabel: string;
  readinessScoreLabel: string;
  criticalBlockersCount: number;
  warningCount: number;
  evidenceCoveragePercent: number;
  lastUpdated: string;
  environment: string;
  nextSafeAction: string;
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
  ownerSummary: OwnerOperatorSummary;
  decisionReasons: DecisionReason[];
  affectedProductAreas: ProductAreaImpact[];
  coverageExplanation: string;
  coverageBlindSpots: string[];
  topRisks: EngineeringIssue[];
  recommendations: string[];
  reasoning: string[];
};
