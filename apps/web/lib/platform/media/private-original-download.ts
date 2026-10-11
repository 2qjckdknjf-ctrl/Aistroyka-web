import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicConfig } from "@/lib/config";
import { MEDIA_BUCKET } from "@/lib/platform/ai/media-bucket.constants";
import { FetchBinaryCapError, fetchBinaryWithByteCap } from "@/lib/platform/ai/fetch-binary-capped";

/** Caller must authorize/validate the source before this read, and recheck it before returning bytes. */
export async function downloadPrivateOriginal(client: SupabaseClient, path: string, maxBytes: number): Promise<{
  data: Blob | null; error: { status: 413 | 503 } | null;
}> {
  try {
    const signed = await client.storage.from(MEDIA_BUCKET).createSignedUrl(path, 30);
    if (signed.error || !signed.data?.signedUrl) return { data: null, error: { status: 503 } };
    const configured = new URL(getPublicConfig().NEXT_PUBLIC_SUPABASE_URL);
    const url = new URL(signed.data.signedUrl);
    if (url.protocol !== "https:" || configured.protocol !== "https:" || url.origin !== configured.origin
      || url.username || url.password || url.hash || !url.pathname.startsWith(`/storage/v1/object/sign/${MEDIA_BUCKET}/`)
      || !url.searchParams.has("token")) return { data: null, error: { status: 503 } };
    const result = await fetchBinaryWithByteCap(url.href, maxBytes,
      { headTimeoutMs: 5000, fetchTimeoutMs: 20000, redirect: "error", cache: "no-store", requireStream: true });
    return { data: new Blob([result.data as BlobPart], { type: result.contentType }), error: null };
  } catch (error) {
    return { data: null, error: { status: error instanceof FetchBinaryCapError && error.code === "too_large" ? 413 : 503 } };
  }
}
