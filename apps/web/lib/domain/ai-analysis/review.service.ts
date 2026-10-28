import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type AiAnalysisReviewStatus,
  isAiAnalysisGraphEligible,
  parseAiAnalysisReviewStatus,
} from "./review-status";

export type ReviewAiAnalysisInput = {
  analysisId: string;
  tenantId: string;
  reviewerUserId: string;
  status: Exclude<AiAnalysisReviewStatus, "pending">;
  note?: string | null;
};

export type ReviewAiAnalysisResult =
  | {
      ok: true;
      analysisId: string;
      reviewStatus: Exclude<AiAnalysisReviewStatus, "pending">;
      graphEligible: boolean;
      reviewedAt: string;
      reviewedBy: string;
    }
  | { ok: false; error: string; code: string };

type AnalysisRow = {
  id: string;
  tenant_id: string;
  review_status: string | null;
};

export function validateReviewVerdict(value: unknown): Exclude<AiAnalysisReviewStatus, "pending"> | null {
  const parsed = parseAiAnalysisReviewStatus(value);
  if (!parsed || parsed === "pending") return null;
  return parsed;
}

/**
 * Record a manager/admin human verdict on a durable vision result.
 * Uses service-role client; caller must already enforce contractor manager rights.
 * Does not expose customer surfaces or mutate Graph overlays directly.
 */
export async function reviewAiAnalysis(
  supabase: SupabaseClient,
  input: ReviewAiAnalysisInput
): Promise<ReviewAiAnalysisResult> {
  const analysisId = input.analysisId.trim();
  const tenantId = input.tenantId.trim();
  const reviewerUserId = input.reviewerUserId.trim();
  if (!analysisId || !tenantId || !reviewerUserId) {
    return { ok: false, error: "analysisId, tenantId and reviewerUserId required", code: "INVALID_INPUT" };
  }

  const note =
    typeof input.note === "string" && input.note.trim()
      ? input.note.trim().slice(0, 2000)
      : null;

  const { data: existing, error: loadError } = await supabase
    .from("ai_analysis")
    .select("id, tenant_id, review_status")
    .eq("id", analysisId)
    .maybeSingle();

  if (loadError) {
    return { ok: false, error: loadError.message, code: "LOOKUP_FAILED" };
  }
  const row = existing as AnalysisRow | null;
  if (!row?.id) {
    return { ok: false, error: "Analysis not found", code: "NOT_FOUND" };
  }
  if (row.tenant_id !== tenantId) {
    return { ok: false, error: "Analysis not found", code: "NOT_FOUND" };
  }

  const reviewedAt = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("ai_analysis")
    .update({
      review_status: input.status,
      reviewed_at: reviewedAt,
      reviewed_by: reviewerUserId,
      review_note: note,
    })
    .eq("id", analysisId)
    .eq("tenant_id", tenantId)
    .select("id, review_status, reviewed_at, reviewed_by")
    .maybeSingle();

  if (updateError) {
    return { ok: false, error: updateError.message, code: "UPDATE_FAILED" };
  }
  if (!updated?.id) {
    return { ok: false, error: "Analysis not found", code: "NOT_FOUND" };
  }

  const status = parseAiAnalysisReviewStatus(updated.review_status) ?? input.status;
  if (status === "pending") {
    return { ok: false, error: "Review status remained pending", code: "UPDATE_FAILED" };
  }

  return {
    ok: true,
    analysisId: String(updated.id),
    reviewStatus: status,
    graphEligible: isAiAnalysisGraphEligible(status),
    reviewedAt: typeof updated.reviewed_at === "string" ? updated.reviewed_at : reviewedAt,
    reviewedBy: typeof updated.reviewed_by === "string" ? updated.reviewed_by : reviewerUserId,
  };
}
