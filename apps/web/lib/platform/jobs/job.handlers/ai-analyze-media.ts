import type { SupabaseClient } from "@supabase/supabase-js";
import { runVisionAnalysis } from "@/lib/ai/runVisionAnalysis";
import { JobPayloadError, JobHandlerError } from "../job.errors";
import type { Job, JobPayloadAiAnalyzeMedia } from "../job.types";
import { resolveImageUrl } from "./resolve-image-url";
import { checkPolicy, recordPolicyDecision } from "@/lib/platform/ai-governance";
import { getTierForTenant } from "@/lib/platform/subscription/subscription.service";

/**
 * Handler for ai_analyze_media: policy check, resolve image URL, run vision analysis.
 * Idempotent: same job run twice is safe.
 */
export async function handleAiAnalyzeMedia(
  supabase: SupabaseClient,
  job: Job
): Promise<void> {
  const payload = job.payload as JobPayloadAiAnalyzeMedia;
  if (!payload || typeof payload.report_id !== "string") {
    throw new JobPayloadError("ai_analyze_media requires payload.report_id");
  }

  const tier = await getTierForTenant(supabase, job.tenant_id);
  const policyResult = checkPolicy({
    tenant_id: job.tenant_id,
    tier: tier as "FREE" | "PRO" | "ENTERPRISE",
    resource_type: "media",
    image_count: 1,
    trace_id: job.trace_id,
  });
  await recordPolicyDecision(supabase, job.tenant_id, policyResult.decision, policyResult.rule_hits, job.trace_id);
  if (policyResult.decision === "block") {
    throw new JobHandlerError("AI policy blocked", false);
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
