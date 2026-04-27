/**
 * AI Brain Phase A — Project Truth Snapshot types.
 * Typed read model for AI Brain context. No hallucinated fields.
 */

export type DataSufficiencyLevel = "full" | "partial" | "missing" | "unavailable";

export interface DataSufficiencyFlags {
  snapshot: "full" | "partial" | "missing";
  health: "full" | "partial" | "missing";
  risks: "full" | "partial" | "missing";
  evidence: "full" | "partial" | "missing";
  schedule: DataSufficiencyLevel;
  approvals: DataSufficiencyLevel;
  budget: DataSufficiencyLevel;
}

export interface OpenTaskCounts {
  total: number;
  overdue: number;
  completed: number;
  inProgress: number;
}

export type ReportFreshness = "fresh" | "stale" | "none" | "unknown";
export type EvidenceQualitySummary = "sufficient" | "gaps" | "unknown";

export interface ProjectTruthSnapshot {
  tenantId: string;
  projectId: string;
  at: string;
  projectStatus: string;
  lastActivityAt: string | null;
  openTaskCounts: OpenTaskCounts;
  reportFreshness: ReportFreshness;
  evidenceQualitySummary: EvidenceQualitySummary;
  topRisksSummary: { count: number; highCount: number };
  missingEvidenceSummary: { count: number };
  intelligenceSummaryAvailability: boolean;
  milestoneSummary: { count: number; available: boolean };
  approvalPressure: { pendingCount: number; available: boolean };
  documentPressure: { underReviewCount: number; available: boolean };
  budgetPressure: {
    available: boolean;
    summary?: string;
    overBudget?: boolean;
    nearingLimit?: boolean;
    lineOverruns?: number;
  };
  dataSufficiencyFlags: DataSufficiencyFlags;
  snapshotWarnings: string[];
}
