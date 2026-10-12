import type { SupabaseClient } from "@supabase/supabase-js";
import { MEDIA_BUCKET } from "@/lib/platform/ai/media-bucket.constants";
import { FetchBinaryCapError, readBinaryStreamWithByteCap } from "@/lib/platform/ai/fetch-binary-capped";

/** Source authorization belongs to the caller; SDK transport retains its current RLS credentials. */
export async function downloadPrivateOriginal(client: SupabaseClient, path: string, maxBytes: number): Promise<{
  data: Blob | null; error: { status: 413 | 503; stage?: string; kind?: string; storage_status?: number } | null;
}> {
  let stage = "metadata_before";
  const failure = (status: 413 | 503, cause?: unknown) => {
    const raw = cause as { name?: string; status?: number; message?: string } | undefined;
    const message = typeof raw?.message === "string" ? raw.message : "";
    const kind = /unsupported cache|cache.*not.*(implemented|supported)/i.test(message) ? "cache_compatibility"
      : /AbortSignal|signal.*(instance|type|valid)/i.test(message) ? "signal_compatibility"
      : /different request|I\/O.*request/i.test(message) ? "request_context_io"
      : /asStream.*not a function/i.test(message) ? "missing_stream_api"
      : /info.*not a function/i.test(message) ? "missing_info_api"
      : ["TypeError", "Error", "AbortError", "TimeoutError", "StorageApiError", "StorageUnknownError", "FetchBinaryCapError"].includes(raw?.name ?? "") ? raw!.name : "unknown";
    return { data: null, error: { status, stage, kind,
      ...(typeof raw?.status === "number" && raw.status >= 100 && raw.status <= 599 ? { storage_status: raw.status } : {}) } };
  };
  try {
    const storage = client.storage.from(MEDIA_BUCKET);
    const before = await storage.info(path);
    if (before.error || !before.data) return failure(503, before.error);
    if (typeof before.data.size === "number" && before.data.size > maxBytes) return { data: null, error: { status: 413 } };
    stage = "stream_open";
    const transport = { cache: "no-store" as const, redirect: "error" as const, signal: AbortSignal.timeout(20000) };
    const stream = await storage.download(path, {}, transport).asStream();
    if (stream.error || !stream.data) return failure(503, stream.error);
    stage = "stream_read";
    const data = await readBinaryStreamWithByteCap(stream.data, maxBytes);
    if (typeof before.data.size === "number" && before.data.size !== data.length) { stage = "size_mismatch"; return failure(503); }
    stage = "metadata_after";
    const after = await storage.info(path);
    if (after.error || !after.data || after.data.version !== before.data.version || after.data.etag !== before.data.etag
      || after.data.size !== before.data.size || after.data.contentType !== before.data.contentType)
      return failure(503, after.error);
    const mime = (before.data.contentType ?? "application/octet-stream").split(";")[0].trim().toLowerCase();
    return { data: new Blob([data as BlobPart], { type: mime }), error: null };
  } catch (error) {
    return failure(error instanceof FetchBinaryCapError && error.code === "too_large" ? 413 : 503, error);
  }
}
