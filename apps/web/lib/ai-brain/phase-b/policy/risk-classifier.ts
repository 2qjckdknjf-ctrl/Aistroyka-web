/**
 * AI Brain Phase B — Risk classifier.
 * Maps action types to risk levels.
 */

import type { AiActionType, AiActionRiskLevel } from "../actions";

const RISK_MAP: Record<AiActionType, AiActionRiskLevel> = {
  explain_state: "read_only",
  summarize_for_manager: "read_only",
  summarize_for_client: "read_only",
  draft_followup_task: "draft_only",
  draft_report_review_note: "draft_only",
  draft_request_more_evidence: "draft_only",
  draft_manager_escalation: "draft_only",
  draft_client_update: "draft_only",
  draft_document_followup: "draft_only",
  draft_approval_followup: "draft_only",
  create_internal_task_draft: "low",
  create_internal_followup_note: "low",
  create_internal_notification_draft: "low",
};

export function classifyRisk(actionType: AiActionType): AiActionRiskLevel {
  return RISK_MAP[actionType] ?? "medium";
}
