/**
 * Field-worker mobile clients: legacy `*_lite` plus canonical `*_worker` headers (same path allow-list).
 * Enforce in middleware AND route handlers (CF may bypass Next middleware for most /api/v1/*).
 */

import { NextResponse } from "next/server";
import { isSamePathOrChild } from "@/lib/api/path-segment";

export { isSamePathOrChild } from "@/lib/api/path-segment";

export const LITE_CLIENT_PATH_FORBIDDEN_CODE = "lite_client_path_forbidden" as const;

function isLiteClient(header: string | null): boolean {
  const v = header?.toLowerCase().trim();
  return v === "ios_lite" || v === "android_lite" || v === "ios_worker" || v === "android_worker";
}

/** Legacy project/AI families that must never be reachable by lite/worker clients. */
export function isLegacyProjectsOrAiPath(pathname: string): boolean {
  return isSamePathOrChild(pathname, "/api/projects") || isSamePathOrChild(pathname, "/api/ai");
}

/** Allowed path prefixes or exact paths for lite clients. */
function isPathAllowed(pathname: string, method: string): boolean {
  const m = (method || "GET").toUpperCase();
  // Wave 3: worker task detail + own-report read — RBAC enforced in route handlers; lite middleware only gates surface area.
  if (m === "GET" && /^\/api\/v1\/tasks\/[^/]+$/.test(pathname)) return true;
  if (m === "GET" && /^\/api\/v1\/reports\/[^/]+$/.test(pathname)) return true;
  // Worker/iOS+Android lite apps list tenant projects (tenant-scoped; same as dashboard read).
  if (pathname === "/api/v1/projects" && method === "GET") return true;
  // Session/tenant bootstrap used by Worker apps and Layer B persona proofs.
  if (pathname === "/api/v1/me" && m === "GET") return true;
  if (pathname === "/api/v1/config") return true;
  if (isSamePathOrChild(pathname, "/api/v1/worker")) return true;
  if (isSamePathOrChild(pathname, "/api/v1/sync")) return true;
  // Tenant-wide list is a manager/cockpit surface. Lite workers only create/finalize sessions.
  if (/^\/api\/v1\/media\/upload-sessions\/?$/.test(pathname) && m !== "POST") return false;
  if (isSamePathOrChild(pathname, "/api/v1/media/upload-sessions")) return true;
  // Tenant-wide device inventory is a manager/cockpit surface. Lite workers only register/unregister.
  if (/^\/api\/v1\/devices\/?$/.test(pathname)) return false;
  if (isSamePathOrChild(pathname, "/api/v1/devices")) return true;
  if (isSamePathOrChild(pathname, "/api/v1/auth")) return true;
  if (m === "GET" && /^\/api\/v1\/reports\/[^/]+\/analysis-status$/.test(pathname)) return true;
  // Worker home intelligence: checklist + localized hints (same routes as web; lite still needs allow-list entry).
  if (pathname === "/api/v1/activation/status" && m === "GET") return true;
  if (pathname === "/api/v1/help/hints" && m === "POST") return true;
  if (pathname === "/api/v1/help/assistant" && m === "POST") return true;
  if (pathname === "/api/v1/help/assistant/events" && m === "POST") return true;
  return false;
}

/**
 * Returns 403 response if request is from a lite client and path is not allowed.
 * Otherwise returns null (caller should proceed).
 *
 * Covers:
 * - `/api/v1/*` allow-list (segment-safe);
 * - legacy `/api/projects*` and `/api/ai/*` (always forbidden for lite).
 */
export function checkLiteAllowList(
  pathname: string,
  method: string,
  xClient: string | null
): { status: 403; body: { error: string; code: string } } | null {
  if (!isLiteClient(xClient)) return null;
  const m = (method || "GET").toUpperCase();

  if (isLegacyProjectsOrAiPath(pathname)) {
    return {
      status: 403,
      body: { error: "forbidden", code: LITE_CLIENT_PATH_FORBIDDEN_CODE },
    };
  }

  if (isSamePathOrChild(pathname, "/api/v1") && !isPathAllowed(pathname, m)) {
    return {
      status: 403,
      body: { error: "forbidden", code: LITE_CLIENT_PATH_FORBIDDEN_CODE },
    };
  }
  return null;
}

/**
 * Handler-level lite allow-list guard. Call before auth side effects when the
 * route does not go through `getTenantContextFromRequest` / `requireTenant`.
 * Returns a 403 NextResponse for disallowed field-worker paths; otherwise null.
 */
export function forbidDisallowedLitePath(request: Request): NextResponse | null {
  const url = new URL(request.url);
  const denied = checkLiteAllowList(url.pathname, request.method, request.headers.get("x-client"));
  if (!denied) return null;
  return NextResponse.json(denied.body, { status: denied.status });
}
