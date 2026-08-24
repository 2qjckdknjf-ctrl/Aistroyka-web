/**
 * Prohibited autonomous AI actions — enforced in code, not documentation alone.
 */

export const PROHIBITED_AI_ACTIONS = [
  "approve_report",
  "reject_report",
  "confirm_work_complete",
  "change_cost",
  "change_contract_deadline",
  "create_financial_obligation",
  "close_issue",
  "delete_photo",
  "delete_document",
  "delete_report",
  "delete_audit_record",
  "send_owner_message_unreviewed",
  "evaluate_worker_performance",
  "rank_workers",
  "hr_decision",
  "change_rbac",
  "create_public_share_link",
  "apply_migration",
  "change_production_config",
] as const;

export type ProhibitedAiActionId = (typeof PROHIBITED_AI_ACTIONS)[number];

export function isProhibitedAiAction(actionId: string): actionId is ProhibitedAiActionId {
  return (PROHIBITED_AI_ACTIONS as readonly string[]).includes(actionId);
}

export function assertAiActionNotProhibited(actionId: string): { ok: true } | { ok: false; reason: string } {
  if (isProhibitedAiAction(actionId)) {
    return { ok: false, reason: `Action ${actionId} is prohibited for autonomous AI execution` };
  }
  return { ok: true };
}
