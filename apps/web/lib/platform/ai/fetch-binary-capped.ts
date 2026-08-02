/**
 * Fetch remote binary with SSRF-safe controls and a hard byte cap (videos for Gemini upload).
 */

import {
  fetchSafeRemoteMedia,
  SafeRemoteMediaError,
  SAFE_VIDEO_MIME_TYPES,
} from "@/lib/platform/ai/safe-remote-media";

export class FetchBinaryCapError extends Error {
  constructor(
    message: string,
    readonly code: "too_large" | "fetch_failed" | "empty" | "ssrf_blocked" | "timeout" | "wrong_mime"
  ) {
    super(message);
    this.name = "FetchBinaryCapError";
  }
}

function mapSafeError(e: SafeRemoteMediaError): FetchBinaryCapError {
  switch (e.code) {
    case "too_large":
      return new FetchBinaryCapError("Video exceeds size limit for this plan.", "too_large");
    case "empty":
      return new FetchBinaryCapError("Empty video body", "empty");
    case "timeout":
      return new FetchBinaryCapError("Video fetch timed out", "timeout");
    case "wrong_mime":
      return new FetchBinaryCapError("Video content-type not allowed", "wrong_mime");
    case "invalid_url":
    case "scheme_not_allowed":
    case "https_required":
    case "host_blocked":
    case "ip_blocked":
    case "dns_blocked":
    case "redirect_blocked":
      return new FetchBinaryCapError("Video URL is not allowed", "ssrf_blocked");
    case "fetch_failed":
      return new FetchBinaryCapError("Video fetch failed", "fetch_failed");
    default: {
      const _exhaustive: never = e.code;
      void _exhaustive;
      return new FetchBinaryCapError("Video fetch failed", "fetch_failed");
    }
  }
}

/**
 * Optional early Content-Length rejection; streaming GET with byte cap and SSRF guards.
 */
export async function fetchBinaryWithByteCap(
  url: string,
  maxBytes: number,
  opts?: {
    signal?: AbortSignal;
    headTimeoutMs?: number;
    fetchTimeoutMs?: number;
    requireHttps?: boolean;
  }
): Promise<{ data: Uint8Array; contentType: string }> {
  try {
    const fetched = await fetchSafeRemoteMedia(url, {
      maxBytes,
      timeoutMs: opts?.fetchTimeoutMs ?? 180_000,
      requireHttps: opts?.requireHttps,
      allowedMimeTypes: SAFE_VIDEO_MIME_TYPES,
      requireMimeAllowList: false,
      allowCrossHostRedirect: false,
      signal: opts?.signal,
    });
    return { data: fetched.data, contentType: fetched.contentType };
  } catch (e) {
    if (e instanceof SafeRemoteMediaError) throw mapSafeError(e);
    throw e;
  }
}
