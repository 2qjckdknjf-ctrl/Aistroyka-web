/**
 * AI Brain Phase B — Action adapter registry.
 */

import type { AiActionType } from "../actions";
import type { AdapterInput, AdapterResult } from "./adapter.types";
import {
  draftFollowupTaskAdapter,
  draftReportReviewNoteAdapter,
  draftRequestMoreEvidenceAdapter,
  draftManagerEscalationAdapter,
  draftClientUpdateAdapter,
  draftDocumentFollowupAdapter,
  draftApprovalFollowupAdapter,
} from "./draft-adapters";

type AdapterFn = (input: AdapterInput) => Promise<AdapterResult>;

const REGISTRY: Partial<Record<AiActionType, AdapterFn>> = {
  draft_followup_task: draftFollowupTaskAdapter,
  draft_report_review_note: draftReportReviewNoteAdapter,
  draft_request_more_evidence: draftRequestMoreEvidenceAdapter,
  draft_manager_escalation: draftManagerEscalationAdapter,
  draft_client_update: draftClientUpdateAdapter,
  draft_document_followup: draftDocumentFollowupAdapter,
  draft_approval_followup: draftApprovalFollowupAdapter,
};

export async function executeAdapter(
  actionType: AiActionType,
  input: AdapterInput
): Promise<AdapterResult> {
  const adapter = REGISTRY[actionType];
  if (!adapter) {
    return {
      success: false,
      available: false,
      degradationReason: `No adapter for action type: ${actionType}`,
    };
  }
  return adapter(input);
}

export function hasAdapter(actionType: AiActionType): boolean {
  return actionType in REGISTRY;
}
