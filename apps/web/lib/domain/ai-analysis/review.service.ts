import type { SupabaseClient } from "@supabase/supabase-js";
import { invalidateConstructionGraphForSource } from "@/lib/domain/construction-graph/construction-graph.repository";
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

/**
 * AIS-GRAPH-004: when a verdict removes Graph eligibility, drop overlay edges/nodes
 * for this analysis immediately. Failures are non-fatal so the review write still sticks.
 */
async function bestEffortInvalidateGraphForRevokedAnalysis(
  supabase: SupabaseClient,
  tenantId: string,
  analysisId: string,
  mediaId: string | null
): Promise<void> {
  try {
    let projectId: string | null = null;
    if (mediaId) {
      const media = await supabase
        .from("media")
        .select("project_id")
        .eq("id", mediaId)
        .eq("tenant_id", tenantId)
        .maybeSingle();
      if (typeof media.data?.project_id === "string") {
        projectId = media.data.project_id;
      }
    }
    await invalidateConstructionGraphForSource(supabase, {
      tenantId,
      projectId,
      sourceTable: "ai_analysis",
      sourceId: analysisId,
    });
  } catch {
    // Overlay invalidation must not roll back a durable human verdict.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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
  const analysisId = input.analysisId.trim().toLowerCase();
  const tenantId = input.tenantId.trim().toLowerCase();
  const reviewerUserId = input.reviewerUserId.trim().toLowerCase();
  if (!analysisId || !tenantId || !reviewerUserId) {
    return { ok: false, error: "analysisId, tenantId and reviewerUserId required", code: "INVALID_INPUT" };
  }

  if (!validateReviewVerdict(input.status)) {
    return { ok: false, error: "Invalid review verdict", code: "INVALID_INPUT" };
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

  // Send only the supported prediction patch. The database reads the original
  // under a row lock, so concurrent reviews cannot snapshot stale predictions.
  const correctedPayload: Record<string, unknown> | null = input.status === "edited" ? {} : null;
  if (correctedPayload && input.correctedPayload) {
    const c = input.correctedPayload;
    if (typeof c.stage === "string") correctedPayload.stage = c.stage.slice(0, 200);
    if (typeof c.completion_percent === "number" && Number.isFinite(c.completion_percent)) {
      correctedPayload.completion_percent = Math.max(0, Math.min(100, Math.trunc(c.completion_percent)));
    }
    if (typeof c.risk_level === "string") correctedPayload.risk_level = c.risk_level.slice(0, 40);
    if (Array.isArray(c.detected_issues)) {
      correctedPayload.detected_issues = c.detected_issues.filter((v): v is string => typeof v === "string").slice(0, 64);
    }
    if (Array.isArray(c.recommendations)) {
      correctedPayload.recommendations = c.recommendations.filter((v): v is string => typeof v === "string").slice(0, 64);
    }
  }

  const { data, error } = await supabase.rpc("review_ai_analysis_atomic", {
    p_analysis_id: analysisId,
    p_tenant_id: tenantId,
    p_reviewer_user_id: reviewerUserId,
    p_status: input.status,
    p_note: note,
    p_corrected_payload: correctedPayload,
  });
  if (error) {
    if (error.code === "P0002") return { ok: false, error: "Analysis not found", code: "NOT_FOUND" };
    if (error.code === "42501") return { ok: false, error: "Reviewer is not authorized", code: "FORBIDDEN" };
    if (error.code === "22023" || error.code === "23514" || error.code === "22P02") {
      return { ok: false, error: "Invalid review payload", code: "INVALID_INPUT" };
    }
    // Do not return database error details that could contain a stored prediction.
    return { ok: false, error: "Review could not be recorded", code: "UPDATE_FAILED" };
  }
  const status = isRecord(data) ? parseAiAnalysisReviewStatus(data.review_status) : null;
  if (!isRecord(data) || data.id !== analysisId || !status || status === "pending" || status !== input.status ||
      typeof data.reviewed_at !== "string" || !data.reviewed_at || data.reviewed_by !== reviewerUserId ||
      typeof data.correction_id !== "string" || !data.correction_id) {
    return { ok: false, error: "Incomplete review receipt", code: "UPDATE_FAILED" };
  }

  const graphEligible = isAiAnalysisGraphEligible(status);
  if (!graphEligible) {
    await bestEffortInvalidateGraphForRevokedAnalysis(
      supabase, tenantId, analysisId, typeof data.media_id === "string" ? data.media_id : null
    );
  }
  return {
    ok: true,
    analysisId,
    reviewStatus: status,
    graphEligible,
    reviewedAt: data.reviewed_at,
    reviewedBy: reviewerUserId,
    correctionId: data.correction_id,
  };
}
