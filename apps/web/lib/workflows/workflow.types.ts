/**
 * Workflow automation — trigger, condition, action types.
 */

export type TriggerType =
  | "report_submitted"
  | "report_missing"
  | "task_overdue"
  | "risk_detected"
  | "missing_evidence_detected"
  | "project_health_degraded";

export type ActionType =
  | "notify_manager"
  | "create_followup_task"
  | "create_alert_record"
  | "request_missing_evidence"
  | "enqueue_copilot_summary";

export type ConditionKind =
  | "severity_gte"
  | "overdue_days_gt"
  | "evidence_missing"
  | "repeated_problem_count"
  | "project_risk_score_gte";

export interface WorkflowTrigger {
  type: TriggerType;
  projectId?: string;
  tenantId: string;
  payload: Record<string, unknown>;
  at: string;
}

export interface WorkflowCondition {
  kind: ConditionKind;
  threshold?: number;
  severity?: string;
  /** For repeated_problem_count */
  count?: number;
}

export interface WorkflowAction {
  type: ActionType;
  params?: Record<string, unknown>;
}

export interface WorkflowRule {
  id: string;
  trigger: TriggerType;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
}

export interface WorkflowContext {
  trigger: WorkflowTrigger;
  projectId: string;
  tenantId: string;
  severity?: string;
  overdueDays?: number;
  riskScore?: number;
  missingEvidenceCount?: number;
  repeatedCount?: number;
}
