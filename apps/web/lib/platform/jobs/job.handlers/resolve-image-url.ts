import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicConfig } from "@/lib/config";
import type { JobPayloadAiAnalyzeMedia } from "../job.types";

const MEDIA_BUCKET = "media";

/**
 * Resolve image URL for ai_analyze_media from payload (image_url, media_id, or upload_session_id).
 */
export async function resolveImageUrl(
  supabase: SupabaseClient,
  payload: JobPayloadAiAnalyzeMedia
): Promise<string | null> {
  if (typeof payload.image_url === "string" && payload.image_url.trim()) {
    return payload.image_url.trim();
  }
  if (payload.media_id) {
    const { data } = await supabase
      .from("media")
      .select("file_url")
      .eq("id", payload.media_id)
      .maybeSingle();
    const url = (data as { file_url?: string } | null)?.file_url;
    return typeof url === "string" && url ? url : null;
  }
  if (payload.upload_session_id) {
    const { data } = await supabase
      .from("upload_sessions")
      .select("object_path")
      .eq("id", payload.upload_session_id)
      .eq("status", "finalized")
      .maybeSingle();
    const path = (data as { object_path?: string } | null)?.object_path;
    if (typeof path !== "string" || !path) return null;
    try {
      const { NEXT_PUBLIC_SUPABASE_URL } = getPublicConfig();
      return `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
    } catch {
      return null;
    }
  }
  return null;
}
