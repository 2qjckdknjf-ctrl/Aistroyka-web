import { NextResponse } from "next/server";
import { setLegacyApiHeaders } from "@/lib/api/deprecation-headers";
import { forbidLiteOnLegacyRoute } from "@/lib/api/legacy-lite-guard";

function resolveCanonicalV1Path(request: Request, canonicalPath?: string): string {
  if (canonicalPath) {
    if (!canonicalPath.startsWith("/api/v1/") && canonicalPath !== "/api/v1") {
      throw new Error(`canonicalPath must be under /api/v1: ${canonicalPath}`);
    }
    return canonicalPath;
  }
  const u = new URL(request.url);
  return u.pathname.replace(/^\/api\//, "/api/v1/");
}

/**
 * Deprecated non-v1 alias → canonical /api/v1 path via HTTP 307.
 *
 * - Automatic mapping: `/api/tenant/invite` → `/api/v1/tenant/invite`
 * - Explicit target: pass `canonicalPath` (e.g. `/api/invite` → `/api/v1/tenant/invite`)
 * - Preserves query string, method, and unread body (307)
 * - Sets Deprecation, Sunset, and Link rel=successor
 */
export function redirectDeprecatedApiToV1(
  request: Request,
  canonicalPath?: string
): NextResponse {
  const u = new URL(request.url);
  const targetPath = resolveCanonicalV1Path(request, canonicalPath);
  const res = NextResponse.redirect(new URL(targetPath + u.search, u.origin), 307);
  setLegacyApiHeaders(res.headers);
  res.headers.set("Link", `<${targetPath}>; rel="successor"`);
  return res;
}

/**
 * 307 to the same path under /api/v1 (query string preserved) with deprecation headers.
 * Example: /api/tenant/invite → /api/v1/tenant/invite
 */
export function redirectToV1PreservePath(request: Request): NextResponse {
  return redirectDeprecatedApiToV1(request);
}

/**
 * Legacy project/AI routes: lite clients get 403; everyone else gets a 307 to /api/v1/*
 * with deprecation + successor Link headers.
 */
export function redirectLegacyApiToV1(request: Request): NextResponse {
  const denied = forbidLiteOnLegacyRoute(request);
  if (denied) return denied;
  return redirectDeprecatedApiToV1(request);
}

/**
 * Attach deprecation + successor headers to a delegated compatibility response
 * (e.g. webhook alias that must not redirect).
 */
export function applyLegacyDeprecationHeaders(
  response: Response,
  canonicalPath: string
): Response {
  setLegacyApiHeaders(response.headers);
  response.headers.set("Link", `<${canonicalPath}>; rel="successor"`);
  return response;
}
