import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnalysisResult } from "@/lib/ai/types";
import { JobHandlerError } from "../job.errors";

export type PersistReportMediaInput = {
  tenantId: string;
  platformJobId: string;
  reportId: string;
  mediaId: string | null | undefined;
  trustedProjectId: string | null;
  result: AnalysisResult;
};

/**
 * Persist a successful report-media vision result.
 *
 * Media-backed attachments reuse public.ai_analysis (media_id NOT NULL).
 * Upload-session-only attachments cannot satisfy that FK today — callers must
 * promote to media_id before claiming durable evidence (explicit contract).
 */
export async function findExistingReportMediaAnalysis(
  supabase: SupabaseClient,
  platformJobId: string
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("ai_analysis")
    .select("id")
    .eq("platform_job_id", platformJobId)
    .maybeSingle();
  if (error) {
    throw new JobHandlerError(
      `Durable result lookup failed: ${error.message}`,
      true,
      "AI_RESULT_LOOKUP_FAILED"
    );
  }
  if (!data?.id) return null;
  return { id: String(data.id) };
}

export async function persistReportMediaAnalysis(
  supabase: SupabaseClient,
  input: PersistReportMediaInput
): Promise<{ analysisId: string; created: boolean }> {
  const existing = await findExistingReportMediaAnalysis(supabase, input.platformJobId);
  if (existing) return { analysisId: existing.id, created: false };

  const mediaId = typeof input.mediaId === "string" ? input.mediaId.trim() : "";
  if (!mediaId) {
    throw new JobHandlerError(
      "Durable report-media result requires media_id; promote the upload session before evidence claims",
      false,
      "AI_RESULT_MEDIA_ID_REQUIRED"
    );
  }

  const { data, error } = await supabase
    .from("ai_analysis")
    .insert({
      media_id: mediaId,
      tenant_id: input.tenantId,
      platform_job_id: input.platformJobId,
      stage: input.result.stage,
      completion_percent: input.result.completion_percent,
      risk_level: input.result.risk_level,
      detected_issues: input.result.detected_issues,
      recommendations: input.result.recommendations,
      // Durable results start pending; Graph promotion requires human accept.
      review_status: "pending",
    })
    .select("id")
    .maybeSingle();

  if (error) {
    // Concurrent retry may race the unique platform_job_id index.
    const raced = await findExistingReportMediaAnalysis(supabase, input.platformJobId);
    if (raced) return { analysisId: raced.id, created: false };
    throw new JobHandlerError(
      `Durable result persist failed: ${error.message}`,
      true,
      "AI_RESULT_PERSIST_FAILED"
    );
  }
  if (!data?.id) {
    throw new JobHandlerError(
      "Durable result persist returned no row",
      true,
      "AI_RESULT_PERSIST_FAILED"
    );
  }
  return { analysisId: String(data.id), created: true };
}
