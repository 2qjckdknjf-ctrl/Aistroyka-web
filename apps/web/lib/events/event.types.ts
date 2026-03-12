/**
 * Domain events and alert records for platform core.
 * AI conclusions and workflow actions can be audited via these types.
 */

export type DomainEventType =
  | "report_submitted"
  | "task_overdue"
  | "risk_detected"
  | "evidence_missing"
  | "project_health_degraded"
  | "workflow_triggered"
  | "workflow_action_executed"
  | "copilot_summary_generated"
  | "ai_insight_generated";

export interface DomainEvent {
  id: string;
  type: DomainEventType;
  tenantId: string;
  projectId?: string;
  at: string;
  source: "ai_brain" | "workflow" | "copilot" | "system";
  payload: Record<string, unknown>;
}

export interface AlertRecord {
  id: string;
  tenantId: string;
  projectId?: string;
  type: string;
  severity: "low" | "medium" | "high";
  title: string;
  body?: string;
  at: string;
  source: "workflow" | "ai_brain" | "copilot";
  resourceType?: string;
  resourceId?: string;
  /** For explainability: why this alert was created */
  reason?: string;
}
