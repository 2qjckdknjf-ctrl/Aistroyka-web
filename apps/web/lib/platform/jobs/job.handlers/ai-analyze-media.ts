import type { SupabaseClient } from "@supabase/supabase-js";
import { runVisionAnalysis } from "@/lib/ai/runVisionAnalysis";
import { JobPayloadError, JobHandlerError } from "../job.errors";
import type { Job, JobPayloadAiAnalyzeMedia } from "../job.types";
import { resolveImageUrl } from "./resolve-image-url";

/**
 * Handler for ai_analyze_media: resolve image URL, run vision analysis, persist result if needed.
 * Idempotent: same job run twice is safe (analysis is read-only for storage in Phase 2).
 */
export async function handleAiAnalyzeMedia(
  supabase: SupabaseClient,
  job: Job
): Promise<void> {
  const payload = job.payload as JobPayloadAiAnalyzeMedia;
  if (!payload || typeof payload.report_id !== "string") {
    throw new JobPayloadError("ai_analyze_media requires payload.report_id");
  }

  const imageUrl = await resolveImageUrl(supabase, payload);
  if (!imageUrl) {
    throw new JobPayloadError("Could not resolve image_url from media_id or upload_session_id");
  }

  try {
    await runVisionAnalysis(imageUrl, {
      tenantId: job.tenant_id,
      userId: job.user_id ?? undefined,
      traceId: job.trace_id ?? undefined,
      recordUsageWithAdmin: supabase,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Vision analysis failed";
    const retryable = message.includes("timeout") || message.includes("5");
    throw new JobHandlerError(message, retryable);
  }
}
