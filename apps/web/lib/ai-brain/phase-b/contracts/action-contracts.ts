/**
 * AI Brain Phase B — Action contract schemas (Zod).
 */

import { z } from "zod";

export const TargetEntityRefSchema = z.object({
  resourceType: z.string(),
  resourceId: z.string(),
});

export const AiActionProvenanceSchema = z.object({
  mode: z.string(),
  runId: z.string().optional(),
  snapshotAt: z.string().optional(),
});

export const AiActionDraftSchema = z.object({
  actionId: z.string(),
  tenantId: z.string(),
  projectId: z.string(),
  requestedBy: z.string().optional(),
  mode: z.string(),
  actionType: z.enum([
    "explain_state",
    "summarize_for_manager",
    "summarize_for_client",
    "draft_followup_task",
    "draft_report_review_note",
    "draft_request_more_evidence",
    "draft_manager_escalation",
    "draft_client_update",
    "draft_document_followup",
    "draft_approval_followup",
    "create_internal_task_draft",
    "create_internal_followup_note",
    "create_internal_notification_draft",
  ]),
  riskLevel: z.enum(["read_only", "draft_only", "low", "medium", "high"]),
  requiresApproval: z.boolean(),
  status: z.enum(["proposed", "draft_ready", "pending_approval", "approved", "rejected", "unavailable"]),
  title: z.string(),
  rationale: z.string(),
  factsUsed: z.array(z.string()),
  inferredReasoningSummary: z.string(),
  targetEntityRefs: z.array(TargetEntityRefSchema),
  payload: z.record(z.unknown()),
  availabilityFlags: z.record(z.boolean()),
  warnings: z.array(z.string()),
  createdAt: z.string(),
  provenance: AiActionProvenanceSchema.optional(),
});

export type AiActionDraftValidated = z.infer<typeof AiActionDraftSchema>;

export function validateAiActionDraft(data: unknown): { success: true; data: AiActionDraftValidated } | { success: false; error: string } {
  const result = AiActionDraftSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return {
    success: false,
    error: result.error.errors.map((e) => e.message).join("; "),
  };
}
