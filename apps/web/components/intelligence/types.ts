/**
 * Types for intelligence UI — match API /api/v1/projects/[id]/intelligence and alerts.
 */

export type SignalSeverity = "low" | "medium" | "high";

export interface ProjectHealthData {
  projectId: string;
  tenantId: string;
  at: string;
  score: number;
  label: "healthy" | "moderate" | "unstable" | "critical";
  blockers: string[];
  missingData: string[];
  delayIndicators: string[];
}

export interface ManagerInsightData {
  id: string;
  projectId: string;
  tenantId: string;
  type: "risk" | "delay" | "missing_evidence" | "blocker" | "recommendation";
  severity: SignalSeverity;
  title: string;
  body: string;
  suggestedAction?: string;
  at: string;
  source: "ai_brain" | "workflow" | "copilot";
}

export interface RiskSignalData {
  projectId: string;
  source: string;
  severity: SignalSeverity;
  title: string;
  description?: string;
  at: string;
  resourceType?: string;
  resourceId?: string;
}

export interface RiskOverviewData {
  high: number;
  medium: number;
  low: number;
  signals: RiskSignalData[];
}

export interface EvidenceSignalData {
  projectId: string;
  taskId?: string;
  type: string;
  severity: SignalSeverity;
  required?: number;
  actual?: number;
  message: string;
  at: string;
}

export interface ReportSignalData {
  projectId: string;
  type: string;
  severity: SignalSeverity;
  message: string;
  at: string;
  dayId?: string;
}

export interface ExecutiveSummaryData {
  scope: "project" | "portfolio";
  projectId?: string;
  tenantId: string;
  at: string;
  headline: string;
  summary: string;
  healthLabel: string;
  topRisks: string[];
  recommendedActions: string[];
  metrics: { label: string; value: string }[];
}

export interface ActionRecommendationData {
  id: string;
  projectId: string;
  tenantId: string;
  type: string;
  title: string;
  description?: string;
  priority: SignalSeverity;
  at: string;
  relatedResourceType?: string;
  relatedResourceId?: string;
}

export interface MissingEvidenceInsightData {
  id: string;
  projectId: string;
  type: string;
  severity: SignalSeverity;
  title: string;
  explanation: string;
  evidenceReferences: { resourceType: string; resourceId: string }[];
  confidence: string;
  contributingFactors: string[];
  recommendedAction: string;
  missingDataDisclaimer?: string;
  at: string;
}

export interface TopRiskInsightData {
  id: string;
  projectId: string;
  rank: number;
  severity: SignalSeverity;
  title: string;
  description: string;
  source: string;
  explanation: string;
  evidenceReferences: { resourceType: string; resourceId: string }[];
  confidence: string;
  contributingFactors: string[];
  recommendedAction: string;
  missingDataDisclaimer?: string;
  at: string;
}

export interface ProjectHealthScoreData {
  projectId: string;
  tenantId: string;
  at: string;
  score: number;
  label: string;
  factorContributions: { factor: string; impact: number; explanation: string }[];
  blockers: string[];
  missingData: string[];
  delayIndicators: string[];
  confidence: string;
  missingDataDisclaimer?: string;
}

export interface ExecutiveProjectSummaryData {
  projectId: string;
  tenantId: string;
  at: string;
  headline: string;
  summary: string;
  healthLabel: string;
  healthScore: number;
  recentProgress: string[];
  atRisk: string[];
  missingEvidence: string[];
  requiresAttention: string[];
  topRisks: string[];
  recommendedActions: string[];
  metrics: { label: string; value: string }[];
  dataSufficiency: string;
  missingDataDisclaimer?: string;
}

export interface ProjectIntelligenceData {
  health?: ProjectHealthData;
  insights: ManagerInsightData[];
  riskOverview: RiskOverviewData;
  evidenceCoverage: { signals: EvidenceSignalData[] };
  reportingDiscipline: { signals: ReportSignalData[] };
  executiveSummary?: ExecutiveSummaryData;
  recommendations: ActionRecommendationData[];
  missingEvidenceInsights?: MissingEvidenceInsightData[];
  topRiskInsights?: TopRiskInsightData[];
  executiveProjectSummary?: ExecutiveProjectSummaryData;
  projectHealthScore?: ProjectHealthScoreData;
}

export interface AlertItemData {
  id: string;
  tenant_id: string | null;
  severity: string;
  type: string;
  message: string;
  created_at: string;
  resolved_at: string | null;
}
