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

/**
 * Handler for ai_analyze_media: resolve image URL, run vision via AIService (Policy → Router → usage).
 * Idempotent: same job run twice is safe (vision result is not duplicated into analysis tables here).
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

  const resolved = await resolveImageUrlDetailed(supabase, payload, {
    tenantId: job.tenant_id,
    projectId: typeof raw.project_id === "string" ? raw.project_id : null,
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
    await analyzeImage(
      supabase,
      {
        tenantId: job.tenant_id,
        userId: job.user_id ?? null,
        subscriptionTier: tier ?? "free",
        traceId: job.trace_id ?? null,
      },
      {
        imageUrl: resolved.imageUrl,
        mediaId: payload.media_id ?? null,
        reportId: payload.report_id,
        projectId: typeof raw.project_id === "string" ? raw.project_id : null,
      },
    );
  } catch (e) {
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
