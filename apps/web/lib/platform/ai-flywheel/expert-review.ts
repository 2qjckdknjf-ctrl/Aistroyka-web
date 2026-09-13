/**
 * Expert review foundation — inert unless AI_EXPERT_REVIEW_ENABLED.
 * Full queue UX deferred to future phase.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { isAiExpertReviewEnabled } from "./flags";

export type ExpertVerdict =
  | "model_correct"
  | "model_partially_correct"
  | "model_wrong"
  | "both_models_wrong";

export interface ExpertReviewInput {
  aiRequestId?: string | null;
  tenantId: string;
  taskType: string;
  expertUserId: string;
  verdict: ExpertVerdict;
  expertConclusion: string;
  expertRationale?: string | null;
  correctedOutputJson?: Record<string, unknown> | null;
  inputSource?: string;
  reviewTimeSeconds?: number | null;
}

export interface ExpertReviewResult {
  created: boolean;
  id?: string;
  reason?: string;
}

/** Create expert review record. No-op when flag disabled. */
export async function createExpertReviewCandidate(
  supabase: SupabaseClient,
  input: ExpertReviewInput
): Promise<ExpertReviewResult> {
  if (!isAiExpertReviewEnabled()) {
    return { created: false, reason: "AI_EXPERT_REVIEW_ENABLED is false" };
  }

  const { data, error } = await supabase
    .from("ai_expert_reviews")
    .insert({
      ai_request_id: input.aiRequestId ?? null,
      tenant_id: input.tenantId,
      task_type: input.taskType,
      expert_user_id: input.expertUserId,
      verdict: input.verdict,
      expert_conclusion: input.expertConclusion,
      expert_rationale: input.expertRationale ?? null,
      corrected_output_json: input.correctedOutputJson ?? null,
      input_source: input.inputSource ?? "text",
      review_time_seconds: input.reviewTimeSeconds ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { created: false, reason: error.message };
  }

  return { created: true, id: data?.id as string };
}
