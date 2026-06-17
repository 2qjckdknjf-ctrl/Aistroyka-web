/**
 * Expert Review Queue types.
 */

import type { ExpertVerdict } from "../expert-review";

export type ExpertReviewQueueStatus =
  | "pending"
  | "in_review"
  | "completed"
  | "skipped"
  | "rejected";

export type ExpertReviewQueuePriority = "low" | "normal" | "high";

export type ExpertReviewQueueProvenance =
  | "preference_pair"
  | "feedback_record"
  | "manual"
  | "system";

export interface ExpertReviewQueueRow {
  id: string;
  tenant_id: string;
  source_table: string;
  source_id: string;
  task_type: string;
  audience: string;
  input_json: Record<string, unknown>;
  model_output_json: Record<string, unknown>;
  priority: ExpertReviewQueuePriority;
  status: ExpertReviewQueueStatus;
  assigned_expert_user_id: string | null;
  provenance: string;
  created_at: string;
  updated_at: string;
}

export interface ExpertReviewQueueCandidate {
  tenantId: string;
  sourceTable: string;
  sourceId: string;
  taskType: string;
  audience: string;
  inputJson: Record<string, unknown>;
  modelOutputJson: Record<string, unknown>;
  priority?: ExpertReviewQueuePriority;
  provenance: ExpertReviewQueueProvenance;
}

export interface ExpertReviewQueueBuildStats {
  candidatesScanned: number;
  piiRejected: number;
  financeRejected: number;
  duplicateSkipped: number;
  eligible: number;
  written: number;
}

export interface SubmitExpertReviewInput {
  queueId: string;
  tenantId: string;
  expertUserId: string;
  verdict: ExpertVerdict;
  expertConclusion: string;
  expertRationale?: string | null;
  correctedOutputJson?: Record<string, unknown> | null;
  reviewTimeSeconds?: number | null;
}

export interface SubmitExpertReviewResult {
  ok: boolean;
  reviewId?: string;
  reason?: string;
  goldMemoryBridgeDryRun?: boolean;
}
