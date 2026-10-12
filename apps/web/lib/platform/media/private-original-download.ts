import type { SupabaseClient } from "@supabase/supabase-js";
import { MEDIA_BUCKET } from "@/lib/platform/ai/media-bucket.constants";
import { FetchBinaryCapError, readBinaryStreamWithByteCap } from "@/lib/platform/ai/fetch-binary-capped";

/** Source authorization belongs to the caller; SDK transport retains its current RLS credentials. */
export async function downloadPrivateOriginal(client: SupabaseClient, path: string, maxBytes: number): Promise<{
  data: Blob | null; error: { status: 413 | 503 } | null;
}> {
  try {
    const storage = client.storage.from(MEDIA_BUCKET);
    const before = await storage.info(path);
    if (before.error || !before.data) return { data: null, error: { status: 503 } };
    if (typeof before.data.size === "number" && before.data.size > maxBytes) return { data: null, error: { status: 413 } };
    const transport = { cache: "no-store" as const, redirect: "error" as const, signal: AbortSignal.timeout(20000) };
    const stream = await storage.download(path, {}, transport).asStream();
    if (stream.error || !stream.data) return { data: null, error: { status: 503 } };
    const data = await readBinaryStreamWithByteCap(stream.data, maxBytes);
    if (typeof before.data.size === "number" && before.data.size !== data.length) return { data: null, error: { status: 503 } };
    const after = await storage.info(path);
    if (after.error || !after.data || after.data.version !== before.data.version || after.data.etag !== before.data.etag
      || after.data.size !== before.data.size || after.data.contentType !== before.data.contentType)
      return { data: null, error: { status: 503 } };
    const mime = (before.data.contentType ?? "application/octet-stream").split(";")[0].trim().toLowerCase();
    return { data: new Blob([data as BlobPart], { type: mime }), error: null };
  } catch (error) {
    return { data: null, error: { status: error instanceof FetchBinaryCapError && error.code === "too_large" ? 413 : 503 } };
  }
}
