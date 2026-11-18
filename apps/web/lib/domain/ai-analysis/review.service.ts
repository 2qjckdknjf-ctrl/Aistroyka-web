import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type AiAnalysisReviewStatus,
  isAiAnalysisGraphEligible,
  parseAiAnalysisReviewStatus,
} from "./review-status";

export type CorrectedAnalysisPayload = {
  stage?: string | null;
  completion_percent?: number | null;
  risk_level?: string | null;
  detected_issues?: string[] | null;
  recommendations?: string[] | null;
};

export type ReviewAiAnalysisInput = {
  analysisId: string;
  tenantId: string;
  reviewerUserId: string;
  status: Exclude<AiAnalysisReviewStatus, "pending">;
  note?: string | null;
  /** Required when status is edited — human-corrected prediction fields. */
  correctedPayload?: CorrectedAnalysisPayload | null;
};

export type ReviewAiAnalysisResult =
  | {
      ok: true;
      analysisId: string;
      reviewStatus: Exclude<AiAnalysisReviewStatus, "pending">;
      graphEligible: boolean;
      reviewedAt: string;
      reviewedBy: string;
      correctionId: string | null;
    }
  | { ok: false; error: string; code: string };

type AnalysisRow = {
  id: string;
  tenant_id: string;
  review_status: string | null;
  stage: string | null;
  completion_percent: number | null;
  risk_level: string | null;
  detected_issues: string[] | null;
  recommendations: string[] | null;
  frame_count: number | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function snapshotFromRow(row: AnalysisRow): Record<string, unknown> {
  return {
    stage: row.stage,
    completion_percent: row.completion_percent,
    risk_level: row.risk_level,
    detected_issues: row.detected_issues ?? [],
    recommendations: row.recommendations ?? [],
    frame_count: row.frame_count,
  };
}

export function validateReviewVerdict(value: unknown): Exclude<AiAnalysisReviewStatus, "pending"> | null {
  const parsed = parseAiAnalysisReviewStatus(value);
  if (!parsed || parsed === "pending") return null;
  return parsed;
}

/**
 * Record a manager/admin human verdict on a durable vision result.
 * AIS-CORRECTION-009: also appends an immutable correction provenance row with the
 * original prediction snapshot. Caller must already enforce contractor manager rights.
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

  if (input.status === "edited") {
    if (!input.correctedPayload || !isRecord(input.correctedPayload)) {
      return {
        ok: false,
        error: "edited verdict requires correctedPayload",
        code: "INVALID_INPUT",
      };
    }
  }

  const note =
    typeof input.note === "string" && input.note.trim()
      ? input.note.trim().slice(0, 2000)
      : null;

  const { data: existing, error: loadError } = await supabase
    .from("ai_analysis")
    .select(
      "id, tenant_id, review_status, stage, completion_percent, risk_level, detected_issues, recommendations, frame_count"
    )
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

  const originalSnapshot = snapshotFromRow(row);
  const reviewedAt = new Date().toISOString();

  const updateFields: Record<string, unknown> = {
    review_status: input.status,
    reviewed_at: reviewedAt,
    reviewed_by: reviewerUserId,
    review_note: note,
  };

  let correctedPayload: Record<string, unknown> | null = null;
  if (input.status === "edited" && input.correctedPayload) {
    const c = input.correctedPayload;
    if (typeof c.stage === "string") updateFields.stage = c.stage.slice(0, 200);
    if (typeof c.completion_percent === "number" && Number.isFinite(c.completion_percent)) {
      updateFields.completion_percent = Math.max(0, Math.min(100, Math.trunc(c.completion_percent)));
    }
    if (typeof c.risk_level === "string") updateFields.risk_level = c.risk_level.slice(0, 40);
    if (Array.isArray(c.detected_issues)) {
      updateFields.detected_issues = c.detected_issues
        .filter((item): item is string => typeof item === "string")
        .slice(0, 64);
    }
    if (Array.isArray(c.recommendations)) {
      updateFields.recommendations = c.recommendations
        .filter((item): item is string => typeof item === "string")
        .slice(0, 64);
    }
    correctedPayload = {
      stage: updateFields.stage ?? row.stage,
      completion_percent: updateFields.completion_percent ?? row.completion_percent,
      risk_level: updateFields.risk_level ?? row.risk_level,
      detected_issues: updateFields.detected_issues ?? row.detected_issues ?? [],
      recommendations: updateFields.recommendations ?? row.recommendations ?? [],
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("ai_analysis")
    .update(updateFields)
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

  const { data: correction, error: correctionError } = await supabase
    .from("ai_analysis_corrections")
    .insert({
      tenant_id: tenantId,
      analysis_id: analysisId,
      verdict: status,
      original_snapshot: originalSnapshot,
      corrected_payload: correctedPayload,
      reason: note,
      reviewer_user_id: reviewerUserId,
    })
    .select("id")
    .maybeSingle();

  if (correctionError) {
    return { ok: false, error: correctionError.message, code: "CORRECTION_INSERT_FAILED" };
  }

  return {
    ok: true,
    analysisId: String(updated.id),
    reviewStatus: status,
    graphEligible: isAiAnalysisGraphEligible(status),
    reviewedAt: typeof updated.reviewed_at === "string" ? updated.reviewed_at : reviewedAt,
    reviewedBy: typeof updated.reviewed_by === "string" ? updated.reviewed_by : reviewerUserId,
    correctionId: typeof correction?.id === "string" ? correction.id : null,
  };
}
