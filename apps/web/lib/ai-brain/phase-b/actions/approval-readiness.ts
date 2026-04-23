/**
 * AI Brain Phase B — Approval readiness metadata.
 * Makes AI action drafts review-ready without building a new approval system.
 */

import type { AiActionDraft } from "./action.types";

export interface ApprovalReadiness {
  actionId: string;
  requiredApproverRole: "manager" | "admin" | "none";
  blockingReasons: string[];
  recommendedReviewNote: string;
  linkedEntityRefs: Array<{ resourceType: string; resourceId: string }>;
  readinessStatus: "ready_for_review" | "pending_approval" | "draft_only" | "unavailable";
}

export function buildApprovalReadiness(draft: AiActionDraft): ApprovalReadiness {
  const blockingReasons = [...draft.warnings];
  const recommendedReviewNote = draft.rationale;
  const linkedEntityRefs = draft.targetEntityRefs.map((r) => ({
    resourceType: r.resourceType,
    resourceId: r.resourceId,
  }));

  let requiredApproverRole: ApprovalReadiness["requiredApproverRole"] = "none";
  if (draft.requiresApproval) {
    if (draft.actionType.startsWith("create_internal_")) requiredApproverRole = "manager";
    else requiredApproverRole = "manager";
  }

  let readinessStatus: ApprovalReadiness["readinessStatus"] = "draft_only";
  if (draft.status === "unavailable") readinessStatus = "unavailable";
  else if (draft.requiresApproval && draft.status === "pending_approval")
    readinessStatus = "pending_approval";
  else if (draft.status === "draft_ready" || draft.status === "proposed")
    readinessStatus = "ready_for_review";

  return {
    actionId: draft.actionId,
    requiredApproverRole,
    blockingReasons,
    recommendedReviewNote,
    linkedEntityRefs,
    readinessStatus,
  };
}
