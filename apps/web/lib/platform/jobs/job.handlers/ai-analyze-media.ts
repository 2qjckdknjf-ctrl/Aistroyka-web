import type { SupabaseClient } from "@supabase/supabase-js";
import {
  analyzeImage,
  AIPolicyBlockedError,
  AIVisionFailedError,
} from "@/lib/platform/ai/ai.service";
import { AI_ERROR_CODES } from "@/lib/platform/ai/ai-media-errors";
import { JobPayloadError, JobHandlerError } from "../job.errors";
import type { Job, JobPayloadAiAnalyzeMedia } from "../job.types";
import { resolveImageUrlDetailed } from "./resolve-image-url";
import { getTierForTenant } from "@/lib/platform/subscription/subscription.service";
import {
  findExistingReportMediaAnalysis,
  persistReportMediaAnalysis,
} from "./persist-report-media-analysis";

/**
 * Handler for ai_analyze_media: resolve image URL, run vision via AIService (Policy → Router → usage),
 * then persist a durable ai_analysis row bound to media_id + platform job id.
 *
 * Idempotent: if this platform job already wrote ai_analysis, the provider is not called again.
 * Upload-session-only attachments without media_id fail closed after vision until promotion exists.
 *
 * Security: `payload.project_id` is an untrusted claim only. It is never passed into signing
 * as authorization. Trusted project is derived server-side (report → task/day → projects).
 */
export async function handleAiAnalyzeMedia(
  supabase: SupabaseClient,
  job: Job,
): Promise<void> {
  const raw = job.payload as {
    report_id?: string;
    media_id?: string;
    upload_session_id?: string;
    image_url?: string;
    project_id?: string;
  };
  if (!raw || typeof raw.report_id !== "string") {
    throw new JobPayloadError("ai_analyze_media requires payload.report_id");
  }
  const payload: JobPayloadAiAnalyzeMedia = {
    report_id: raw.report_id,
    media_id: raw.media_id,
    upload_session_id: raw.upload_session_id,
    image_url: raw.image_url,
  };

  // Untrusted claim — mismatch detection only; never authorization for signed URLs.
  const projectIdClaim =
    typeof raw.project_id === "string" && raw.project_id.trim()
      ? raw.project_id.trim()
      : null;

  const already = await findExistingReportMediaAnalysis(supabase, job.id);
  if (already) return;

  const mediaId = typeof payload.media_id === "string" ? payload.media_id.trim() : "";
  if (!mediaId) {
    // Fail before provider spend. Upload-session-only attachments need promotion
    // to media_id before durable evidence can be claimed (hard audit contract).
    throw new JobHandlerError(
      "Durable report-media result requires media_id; promote the upload session before evidence claims",
      false,
      "AI_RESULT_MEDIA_ID_REQUIRED"
    );
  }

  const resolved = await resolveImageUrlDetailed(supabase, payload, {
    tenantId: job.tenant_id,
    projectIdClaim,
  });

  if (!resolved.ok) {
    if (resolved.retryable) {
      throw new JobHandlerError(resolved.message, true, resolved.code);
    }
    // Permanent media/reference errors → dead (no infinite retry)
    throw new JobPayloadError(resolved.message, resolved.code);
  }

  const tier = await getTierForTenant(supabase, job.tenant_id);
  try {
    const result = await analyzeImage(
      supabase,
      {
        tenantId: job.tenant_id,
        userId: job.user_id ?? null,
        subscriptionTier: tier ?? "free",
        traceId: job.trace_id ?? null,
      },
      {
        imageUrl: resolved.imageUrl,
        mediaId,
        reportId: payload.report_id,
        // Only server-proven project id — never raw payload.project_id.
        projectId: resolved.trustedProjectId,
      },
    );
    await persistReportMediaAnalysis(supabase, {
      tenantId: job.tenant_id,
      platformJobId: job.id,
      reportId: payload.report_id,
      mediaId,
      trustedProjectId: resolved.trustedProjectId,
      result,
    });
  } catch (e) {
    if (e instanceof JobHandlerError || e instanceof JobPayloadError) {
      throw e;
    }
    if (e instanceof AIPolicyBlockedError) {
      throw new JobHandlerError(
        "AI policy blocked",
        false,
        AI_ERROR_CODES.AI_POLICY_BLOCKED,
      );
    }
    if (e instanceof AIVisionFailedError) {
      throw new JobHandlerError(e.message, e.retryable, e.code);
    }
    const message = e instanceof Error ? e.message : "Vision analysis failed";
    const lower = message.toLowerCase();
    const retryable =
      lower.includes("timeout") ||
      lower.includes("temporar") ||
      lower.includes("429");
    throw new JobHandlerError(
      message,
      retryable,
      retryable
        ? AI_ERROR_CODES.AI_PROVIDER_TEMPORARILY_UNAVAILABLE
        : AI_ERROR_CODES.AI_PROVIDER_FAILED,
    );
  }
}
