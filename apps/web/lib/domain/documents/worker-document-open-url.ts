import type { SupabaseClient } from "@supabase/supabase-js";
import { createSignedUrlForPath } from "@/lib/platform/ai/resolve-ai-media-image";

/**
 * Worker document open URL: keep an existing http(s) path, otherwise sign a
 * tenant-guarded media-bucket object through createSignedUrlForPath.
 */
export async function resolveWorkerDocumentOpenUrl(
  supabase: SupabaseClient,
  tenantId: string,
  objectPath: string | null | undefined
): Promise<string | null> {
  const path = typeof objectPath === "string" ? objectPath.trim() : "";
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const signed = await createSignedUrlForPath(supabase, path, { tenantId });
  return signed.ok ? signed.imageUrl : null;
}
