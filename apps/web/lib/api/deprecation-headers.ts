/**
 * Headers for legacy (non-v1) API routes. Add to NextResponse before returning.
 */

const SUNSET_DATE = "2026-06-01";

export const LEGACY_API_HEADERS: Record<string, string> = {
  Deprecation: "true",
  Sunset: SUNSET_DATE,
};

/** Add legacy deprecation headers to a Response. */
export function addLegacyApiHeaders(response: Response): Response {
  const r = response.clone();
  Object.entries(LEGACY_API_HEADERS).forEach(([key, value]) => r.headers.set(key, value));
  return r;
}

/** For NextResponse.json(), set these on the response before returning. */
export function setLegacyApiHeaders(headers: Headers): void {
  Object.entries(LEGACY_API_HEADERS).forEach(([key, value]) => headers.set(key, value));
}
