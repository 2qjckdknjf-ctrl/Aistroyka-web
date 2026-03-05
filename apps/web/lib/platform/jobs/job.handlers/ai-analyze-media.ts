import type { SupabaseClient } from "@supabase/supabase-js";
import { analyzeImage, AIPolicyBlockedError, AIVisionFailedError } from "@/lib/platform/ai/ai.service";
import { JobPayloadError, JobHandlerError } from "../job.errors";
import type { Job } from "../job.types";
import { resolveImageUrl } from "./resolve-image-url";
import { getTierForTenant } from "@/lib/platform/subscription/subscription.service";

/**
 * Handler for ai_analyze_media: resolve image URL, run vision via AIService (Policy → Router → usage).
 * Idempotent: same job run twice is safe.
 */
export async function handleAiAnalyzeMedia(
  supabase: SupabaseClient,
  job: Job
): Promise<void> {
  const payload = job.payload as { report_id?: string; media_id?: string; upload_session_id?: string };
  if (!payload || typeof payload.report_id !== "string") {
    throw new JobPayloadError("ai_analyze_media requires payload.report_id");
  }

  const imageUrl = await resolveImageUrl(supabase, payload);
  if (!imageUrl) {
    throw new JobPayloadError("Could not resolve image_url from media_id or upload_session_id");
  }

  const tier = await getTierForTenant(supabase, job.tenant_id);
  try {
    await analyzeImage(supabase, {
      tenantId: job.tenant_id,
      userId: job.user_id ?? null,
      subscriptionTier: tier ?? "free",
      traceId: job.trace_id ?? null,
    }, { imageUrl });
  } catch (e) {
    if (e instanceof AIPolicyBlockedError) {
      throw new JobHandlerError("AI policy blocked", false);
    }
    if (e instanceof AIVisionFailedError) {
      const retryable = e.message.toLowerCase().includes("timeout");
      throw new JobHandlerError(e.message, retryable);
    }
    const message = e instanceof Error ? e.message : "Vision analysis failed";
    const retryable = message.includes("timeout");
    throw new JobHandlerError(message, retryable);
  }
}
