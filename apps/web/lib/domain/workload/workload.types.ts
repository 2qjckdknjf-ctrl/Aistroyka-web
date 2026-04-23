/** Wave 4 Step 16 — operational inbox (read model; not a task DB). */

export type WorkloadAudience = "manager" | "stakeholder" | "leadership";

export type WorkloadKind =
  | "pending_reports_queue"
  | "pending_document_decisions"
  | "overdue_milestones"
  | "blocking_punch_defects"
  | "aftercare_needs_action"
  | "discussion_awaiting_manager"
  | "handover_not_ready"
  | "budget_over_planned"
  | "portfolio_critical"
  | "client_request_action"
  | "discussion_awaiting_stakeholder"
  | "recurring_handover_nudge"
  | "recurring_defects_nudge"
  | "recurring_discussion_stale"
  | "recurring_aftercare_review"
  | "governance_escalation";

export type WorkloadPriority = "urgent" | "high" | "normal";

export type WorkloadDueState =
  | "overdue"
  | "blocking"
  | "waiting_on_you"
  | "waiting_on_team"
  | "none";

export type WorkloadStatusBucket = "action_needed" | "review" | "risk";

export interface WorkloadItem {
  /** Stable id for React keys / dedupe */
  id: string;
  audience: WorkloadAudience;
  kind: WorkloadKind;
  priority: WorkloadPriority;
  title: string;
  reason: string;
  project_id: string | null;
  project_name: string | null;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  action_url: string;
  due_state: WorkloadDueState;
  status_bucket: WorkloadStatusBucket;
}

export interface WorkloadInboxResult {
  items: WorkloadItem[];
  counts: { urgent: number; high: number; normal: number };
  audience: WorkloadAudience;
}
