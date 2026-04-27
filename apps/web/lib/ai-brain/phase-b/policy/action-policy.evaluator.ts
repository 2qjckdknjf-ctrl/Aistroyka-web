/**
 * AI Brain Phase B — Action policy evaluator.
 * Decides whether an AI action is allowed, draft-only, requires approval, or forbidden.
 */

import type { AiActionType, AiActionExecutionPolicy } from "../actions";
import type { ProjectTruthSnapshot } from "@/lib/ai-brain/phase-a";
import type { ActionPolicyInput, ActionPolicyResult, RunContextRole } from "./action-policy.types";
import { classifyRisk } from "./risk-classifier";

const READ_ONLY_TYPES: AiActionType[] = ["explain_state", "summarize_for_manager", "summarize_for_client"];
const DRAFT_ONLY_TYPES: AiActionType[] = [
  "draft_followup_task",
  "draft_report_review_note",
  "draft_request_more_evidence",
  "draft_manager_escalation",
  "draft_client_update",
  "draft_document_followup",
  "draft_approval_followup",
];

function clientAllowedTypes(): AiActionType[] {
  return ["explain_state", "summarize_for_client"];
}

function workerAllowedTypes(): AiActionType[] {
  return [
    "explain_state",
    "summarize_for_manager",
    "draft_followup_task",
    "draft_report_review_note",
    "draft_request_more_evidence",
  ];
}

function managerAllowedTypes(): AiActionType[] {
  return [
    ...READ_ONLY_TYPES,
    ...DRAFT_ONLY_TYPES,
    "create_internal_task_draft",
    "create_internal_followup_note",
    "create_internal_notification_draft",
  ];
}

export function evaluateActionPolicy(input: ActionPolicyInput): ActionPolicyResult {
  const { actionType, userRole, snapshot } = input;
  const riskLevel = classifyRisk(actionType);

  const roleAllowed = (): boolean => {
    switch (userRole) {
      case "client":
        return clientAllowedTypes().includes(actionType);
      case "worker":
        return workerAllowedTypes().includes(actionType);
      case "manager":
      case "admin":
        return managerAllowedTypes().includes(actionType);
      default:
        return false;
    }
  };

  if (!roleAllowed()) {
    return {
      policy: "forbidden",
      riskLevel,
      requiresApproval: true,
      unavailableReason: `Action ${actionType} not allowed for role ${userRole}`,
    };
  }

  if (READ_ONLY_TYPES.includes(actionType)) {
    return {
      policy: "allowed_as_read_only",
      riskLevel: "read_only",
      requiresApproval: false,
    };
  }

  if (DRAFT_ONLY_TYPES.includes(actionType)) {
    return {
      policy: "allowed_as_draft_only",
      riskLevel: "draft_only",
      requiresApproval: false,
    };
  }

  if (actionType === "draft_document_followup" || actionType === "draft_approval_followup") {
    if (!snapshot?.documentPressure.available && !snapshot?.approvalPressure.available) {
      return {
        policy: "unavailable_due_to_partial_module",
        riskLevel: "draft_only",
        requiresApproval: false,
        unavailableReason: "Document/approval module not fully available",
      };
    }
  }

  if (
    actionType === "create_internal_task_draft" ||
    actionType === "create_internal_followup_note" ||
    actionType === "create_internal_notification_draft"
  ) {
    if (!snapshot) {
      return {
        policy: "unavailable_due_to_partial_module",
        riskLevel: "low",
        requiresApproval: true,
        unavailableReason: "Snapshot unavailable",
      };
    }
    return {
      policy: "requires_manual_approval",
      riskLevel: "low",
      requiresApproval: true,
    };
  }

  return {
    policy: "allowed_as_draft_only",
    riskLevel,
    requiresApproval: riskLevel === "medium" || riskLevel === "high",
  };
}
