/** Max body size for media-related endpoints (1 MB). */
export const MAX_MEDIA_BODY_BYTES = 1024 * 1024;

/**
 * Check Content-Length and optionally body size. Returns error message if over limit.
 */
export function checkRequestBodySize(request: Request, maxBytes: number = MAX_MEDIA_BODY_BYTES): string | null {
  const cl = request.headers.get("content-length");
  if (cl) {
    const n = parseInt(cl, 10);
    if (!Number.isNaN(n) && n > maxBytes) return "Request body too large";
  }
  return null;
}
