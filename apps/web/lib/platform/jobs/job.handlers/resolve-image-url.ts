import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resolveAIMediaImage,
  type ResolveAIMediaImageResult,
} from "@/lib/platform/ai/resolve-ai-media-image";
import type { JobPayloadAiAnalyzeMedia } from "../job.types";

export type { ResolveAIMediaImageResult };

/**
 * Resolve image URL for ai_analyze_media.
 * Thin wrapper over the unified AI media resolver (signed URL, tenant checks, cascade).
 * @deprecated Prefer resolveAIMediaImage directly when full result codes are needed.
 */
export async function resolveImageUrl(
  supabase: SupabaseClient,
  payload: JobPayloadAiAnalyzeMedia,
  options?: { tenantId: string; projectId?: string | null }
): Promise<string | null> {
  if (!options?.tenantId) {
    // Backward-compat call sites without tenant: cannot safely resolve.
    return null;
  }
  const result = await resolveAIMediaImage(supabase, {
    tenantId: options.tenantId,
    reportId: payload.report_id,
    mediaId: payload.media_id,
    uploadSessionId: payload.upload_session_id,
    imageUrl: payload.image_url,
    projectId: options.projectId ?? null,
  });
  return result.ok ? result.imageUrl : null;
}

/** Full typed resolution for job handlers. */
export async function resolveImageUrlDetailed(
  supabase: SupabaseClient,
  payload: JobPayloadAiAnalyzeMedia,
  options: { tenantId: string; projectId?: string | null }
): Promise<ResolveAIMediaImageResult> {
  return resolveAIMediaImage(supabase, {
    tenantId: options.tenantId,
    reportId: payload.report_id,
    mediaId: payload.media_id,
    uploadSessionId: payload.upload_session_id,
    imageUrl: payload.image_url,
    projectId: options.projectId ?? null,
  });
}
