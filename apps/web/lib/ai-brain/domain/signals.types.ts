/**
 * AI Construction Brain — signal types.
 * These represent interpreted signals from existing data (projects, reports, tasks, media).
 * Used as input for health, risk, and recommendation layers. Do not depend on Supabase.
 */

export type SignalSeverity = "low" | "medium" | "high";

/** Point-in-time aggregate view of a project for the brain. */
export interface ProjectSnapshot {
  projectId: string;
  tenantId: string;
  at: string; // ISO timestamp
  workerCount: number;
  reportCount: number;
  openReportCount: number;
  taskCount: number;
  overdueTaskCount: number;
  completedTaskCount: number;
  mediaCount: number;
  analysisCount: number;
}

/** Computed health summary for a project. */
export interface ProjectHealth {
  projectId: string;
  tenantId: string;
  at: string;
  score: number; // 0–100
  label: "healthy" | "moderate" | "unstable" | "critical";
  blockers: string[];
  missingData: string[];
  delayIndicators: string[];
}

/** Signal derived from task state. */
export interface TaskSignal {
  taskId: string;
  projectId: string;
  type: "overdue" | "blocked" | "missing_report" | "missing_evidence" | "on_track";
  severity: SignalSeverity;
  dueDate?: string;
  assignedTo?: string;
  message: string;
  at: string;
}

/** Signal derived from report state. */
export interface ReportSignal {
  reportId?: string;
  projectId: string;
  type: "submitted" | "missing" | "draft" | "late";
  severity: SignalSeverity;
  dayId?: string;
  userId?: string;
  message: string;
  at: string;
}

/** Signal about photo/evidence coverage. */
export interface EvidenceSignal {
  projectId: string;
  taskId?: string;
  reportId?: string;
  type: "missing" | "partial" | "complete" | "before_after_gap";
  severity: SignalSeverity;
  required?: number;
  actual?: number;
  message: string;
  at: string;
}

/** Aggregated risk signal. */
export interface RiskSignal {
  projectId: string;
  source: "ai_analysis" | "delay" | "missing_evidence" | "overdue" | "manual";
  severity: SignalSeverity;
  title: string;
  description?: string;
  at: string;
  resourceType?: string;
  resourceId?: string;
}

/** Delay indicator. */
export interface DelaySignal {
  projectId: string;
  source: string;
  severity: SignalSeverity;
  message: string;
  at: string;
  expectedDate?: string;
}

/** Missing evidence indicator. */
export interface MissingEvidenceSignal {
  projectId: string;
  taskId?: string;
  reportId?: string;
  message: string;
  at: string;
}

/** Workforce presence/activity signal. */
export interface WorkforceSignal {
  projectId: string;
  at: string;
  activeWorkerCount: number;
  reportedTodayCount: number;
  openShiftNoReportCount: number;
}

/** Single manager-facing insight. */
export interface ManagerInsight {
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

/** Executive summary for a project or portfolio. */
export interface ExecutiveSummary {
  scope: "project" | "portfolio";
  projectId?: string;
  tenantId: string;
  at: string;
  headline: string;
  summary: string;
  healthLabel: ProjectHealth["label"];
  topRisks: string[];
  recommendedActions: string[];
  metrics: { label: string; value: string }[];
}

/** Single recommended action. */
export interface ActionRecommendation {
  id: string;
  projectId: string;
  tenantId: string;
  type: "follow_up" | "request_evidence" | "escalate" | "review" | "other";
  title: string;
  description?: string;
  priority: SignalSeverity;
  at: string;
  relatedResourceType?: string;
  relatedResourceId?: string;
}

/** Alert/event for audit and UI. */
export interface AlertEvent {
  id: string;
  tenantId: string;
  projectId?: string;
  type: string;
  severity: SignalSeverity;
  title: string;
  body?: string;
  at: string;
  source: "workflow" | "ai_brain" | "copilot" | "system";
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}
