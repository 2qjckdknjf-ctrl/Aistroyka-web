/**
 * Expert Review submission service.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { scrubJsonStrings } from "../pii-scrub";
import { verifyScrubbedJson } from "../pii-scrub-verifier";
import { buildGoldMemoryFromCandidates } from "../gold-memory/gold-memory.builder";
import { isAiGoldMemoryWriteEnabled } from "../gold-memory/gold-memory.flags";
import { isExpertReviewGoldMemoryBridgeEnabled } from "./expert-review-queue.flags";
import { getQueueItemById, updateQueueStatus } from "./expert-review-queue.repository";
import { logExpertReviewSubmission } from "./expert-review-queue.observability";
import type { ExpertVerdict } from "../expert-review";
import type {
  SubmitExpertReviewInput,
  SubmitExpertReviewResult,
} from "./expert-review-queue.types";

const VALID_VERDICTS: ExpertVerdict[] = [
  "model_correct",
  "model_partially_correct",
  "model_wrong",
  "both_models_wrong",
];

function isValidVerdict(v: string): v is ExpertVerdict {
  return VALID_VERDICTS.includes(v as ExpertVerdict);
}

export async function submitExpertReview(
  supabase: SupabaseClient,
  input: SubmitExpertReviewInput
): Promise<SubmitExpertReviewResult> {
  if (!isValidVerdict(input.verdict)) {
    return { ok: false, reason: "invalid_verdict" };
  }

  const conclusion = input.expertConclusion.trim();
  if (!conclusion) {
    return { ok: false, reason: "expert_conclusion_required" };
  }

  const queueItem = await getQueueItemById(supabase, input.tenantId, input.queueId);
  if (!queueItem) {
    return { ok: false, reason: "queue_item_not_found" };
  }

  if (queueItem.status === "completed") {
    return { ok: false, reason: "already_completed" };
  }

  if (queueItem.status === "skipped" || queueItem.status === "rejected") {
    return { ok: false, reason: "queue_item_not_actionable" };
  }

  let correctedJson: Record<string, unknown> | null = null;
  if (input.correctedOutputJson) {
    const scrubbed = scrubJsonStrings(input.correctedOutputJson);
    if (!verifyScrubbedJson(scrubbed.value).passed) {
      return { ok: false, reason: "corrected_output_pii" };
    }
    correctedJson = scrubbed.value as Record<string, unknown>;
  }

  const { data: review, error } = await supabase
    .from("ai_expert_reviews")
    .insert({
      tenant_id: input.tenantId,
      task_type: queueItem.task_type,
      expert_user_id: input.expertUserId,
      verdict: input.verdict,
      expert_conclusion: conclusion.slice(0, 4000),
      expert_rationale: input.expertRationale?.trim().slice(0, 2000) ?? null,
      corrected_output_json: correctedJson,
      input_source: queueItem.provenance,
      review_time_seconds: input.reviewTimeSeconds ?? null,
      ai_request_id: queueItem.id,
    })
    .select("id")
    .single();

  if (error || !review?.id) {
    return { ok: false, reason: "review_insert_failed" };
  }

  await updateQueueStatus(supabase, input.queueId, input.tenantId, "completed", input.expertUserId);

  let goldMemoryBridgeDryRun = false;
  if (isExpertReviewGoldMemoryBridgeEnabled()) {
    goldMemoryBridgeDryRun = true;
    await buildGoldMemoryFromCandidates(
      supabase,
      [
        {
          tenantId: input.tenantId,
          taskType: queueItem.task_type,
          audience: queueItem.audience as "manager",
          provenance: "expert_review",
          sourceTable: "ai_expert_reviews",
          sourceId: review.id as string,
          inputJson: queueItem.input_json,
          goldOutputJson: correctedJson ?? { conclusion },
          rationale: input.expertRationale ?? null,
          consent: false,
        },
      ],
      { dryRun: !isAiGoldMemoryWriteEnabled() }
    );
  }

  logExpertReviewSubmission({
    queueId: input.queueId,
    tenantId: input.tenantId,
    taskType: queueItem.task_type,
    audience: queueItem.audience,
    status: "completed",
    reviewerUserId: input.expertUserId,
    verdict: input.verdict,
  });

  return {
    ok: true,
    reviewId: review.id as string,
    goldMemoryBridgeDryRun,
  };
}

export async function skipExpertReviewQueueItem(
  supabase: SupabaseClient,
  tenantId: string,
  queueId: string,
  expertUserId: string
): Promise<{ ok: boolean; reason?: string }> {
  const item = await getQueueItemById(supabase, tenantId, queueId);
  if (!item) return { ok: false, reason: "queue_item_not_found" };
  if (item.status === "completed") return { ok: false, reason: "already_completed" };

  const updated = await updateQueueStatus(supabase, queueId, tenantId, "skipped", expertUserId);
  if (!updated) return { ok: false, reason: "update_failed" };

  logExpertReviewSubmission({
    queueId,
    tenantId,
    taskType: item.task_type,
    audience: item.audience,
    status: "skipped",
    reviewerUserId: expertUserId,
  });

  return { ok: true };
}
