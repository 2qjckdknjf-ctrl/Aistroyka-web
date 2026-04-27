/**
 * AI Brain Phase B — Action domain model types.
 * Typed AI action drafts. Draft-first, no unsafe writes.
 */

export type AiActionType =
  | "explain_state"
  | "summarize_for_manager"
  | "summarize_for_client"
  | "draft_followup_task"
  | "draft_report_review_note"
  | "draft_request_more_evidence"
  | "draft_manager_escalation"
  | "draft_client_update"
  | "draft_document_followup"
  | "draft_approval_followup"
  | "create_internal_task_draft"
  | "create_internal_followup_note"
  | "create_internal_notification_draft";

export type AiActionRiskLevel = "read_only" | "draft_only" | "low" | "medium" | "high";

export type AiActionStatus = "proposed" | "draft_ready" | "pending_approval" | "approved" | "rejected" | "unavailable";

export type AiActionExecutionPolicy =
  | "allowed_as_read_only"
  | "allowed_as_draft_only"
  | "requires_manual_approval"
  | "unavailable_due_to_partial_module"
  | "forbidden";

export interface TargetEntityRef {
  resourceType: string;
  resourceId: string;
}

export interface AiActionProvenance {
  mode: string;
  runId?: string;
  snapshotAt?: string;
}

export interface AiActionDraft {
  actionId: string;
  tenantId: string;
  projectId: string;
  requestedBy?: string;
  mode: string;
  actionType: AiActionType;
  riskLevel: AiActionRiskLevel;
  requiresApproval: boolean;
  status: AiActionStatus;
  title: string;
  rationale: string;
  factsUsed: string[];
  inferredReasoningSummary: string;
  targetEntityRefs: TargetEntityRef[];
  payload: Record<string, unknown>;
  availabilityFlags: Record<string, boolean>;
  warnings: string[];
  createdAt: string;
  provenance?: AiActionProvenance;
}
