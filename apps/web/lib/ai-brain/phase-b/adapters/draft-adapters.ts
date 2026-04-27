/**
 * AI Brain Phase B — Safe draft action adapters.
 * Produce proposal payloads; do not persist. Wrap existing services when execution is supported.
 */

import type { AiActionDraft, AiActionExecutionPolicy } from "../actions";
import type { AdapterInput, AdapterResult } from "./adapter.types";

function requirePolicy(input: AdapterInput, allowed: AiActionExecutionPolicy[]): AdapterResult {
  if (!allowed.includes(input.policy)) {
    return {
      success: false,
      available: false,
      degradationReason: `Policy ${input.policy} does not allow this action`,
    };
  }
  return { success: true, available: true };
}

export async function draftFollowupTaskAdapter(input: AdapterInput): Promise<AdapterResult> {
  const check = requirePolicy(input, ["allowed_as_draft_only", "allowed_as_read_only"]);
  if (!check.success) return check;
  return {
    success: true,
    available: true,
    output: {
      type: "draft_followup_task",
      title: input.draft.title,
      rationale: input.draft.rationale,
      payload: input.draft.payload,
      targetEntityRefs: input.draft.targetEntityRefs,
    },
  };
}

export async function draftReportReviewNoteAdapter(input: AdapterInput): Promise<AdapterResult> {
  const check = requirePolicy(input, ["allowed_as_draft_only", "allowed_as_read_only"]);
  if (!check.success) return check;
  return {
    success: true,
    available: true,
    output: {
      type: "draft_report_review_note",
      title: input.draft.title,
      rationale: input.draft.rationale,
      payload: input.draft.payload,
      targetEntityRefs: input.draft.targetEntityRefs,
    },
  };
}

export async function draftRequestMoreEvidenceAdapter(input: AdapterInput): Promise<AdapterResult> {
  const check = requirePolicy(input, ["allowed_as_draft_only", "allowed_as_read_only"]);
  if (!check.success) return check;
  return {
    success: true,
    available: true,
    output: {
      type: "draft_request_more_evidence",
      title: input.draft.title,
      rationale: input.draft.rationale,
      payload: input.draft.payload,
      targetEntityRefs: input.draft.targetEntityRefs,
    },
  };
}

export async function draftManagerEscalationAdapter(input: AdapterInput): Promise<AdapterResult> {
  const check = requirePolicy(input, ["allowed_as_draft_only", "allowed_as_read_only"]);
  if (!check.success) return check;
  return {
    success: true,
    available: true,
    output: {
      type: "draft_manager_escalation",
      title: input.draft.title,
      rationale: input.draft.rationale,
      payload: input.draft.payload,
    },
  };
}

export async function draftClientUpdateAdapter(input: AdapterInput): Promise<AdapterResult> {
  const check = requirePolicy(input, ["allowed_as_draft_only", "allowed_as_read_only"]);
  if (!check.success) return check;
  return {
    success: true,
    available: true,
    output: {
      type: "draft_client_update",
      title: input.draft.title,
      rationale: input.draft.rationale,
      payload: { ...input.draft.payload, sanitized: true },
    },
  };
}

export async function draftDocumentFollowupAdapter(input: AdapterInput): Promise<AdapterResult> {
  const check = requirePolicy(input, [
    "allowed_as_draft_only",
    "allowed_as_read_only",
    "unavailable_due_to_partial_module",
  ]);
  if (!check.success) return check;
  if (input.policy === "unavailable_due_to_partial_module") {
    return {
      success: false,
      available: false,
      degradationReason: "Document module not fully available",
    };
  }
  return {
    success: true,
    available: true,
    output: {
      type: "draft_document_followup",
      title: input.draft.title,
      rationale: input.draft.rationale,
      payload: input.draft.payload,
      targetEntityRefs: input.draft.targetEntityRefs,
    },
  };
}

export async function draftApprovalFollowupAdapter(input: AdapterInput): Promise<AdapterResult> {
  const check = requirePolicy(input, [
    "allowed_as_draft_only",
    "allowed_as_read_only",
    "unavailable_due_to_partial_module",
  ]);
  if (!check.success) return check;
  if (input.policy === "unavailable_due_to_partial_module") {
    return {
      success: false,
      available: false,
      degradationReason: "Approval module not fully available",
    };
  }
  return {
    success: true,
    available: true,
    output: {
      type: "draft_approval_followup",
      title: input.draft.title,
      rationale: input.draft.rationale,
      payload: input.draft.payload,
      targetEntityRefs: input.draft.targetEntityRefs,
    },
  };
}
