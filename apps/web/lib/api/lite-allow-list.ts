/**
 * Field-worker mobile clients: legacy `*_lite` plus canonical `*_worker` headers (same path allow-list).
 * Enforce in middleware or route guard; return 403 for disallowed paths.
 */

function isLiteClient(header: string | null): boolean {
  const v = header?.toLowerCase().trim();
  return v === "ios_lite" || v === "android_lite" || v === "ios_worker" || v === "android_worker";
}

/** Allowed path prefixes or exact paths for lite clients. */
function isPathAllowed(pathname: string, method: string): boolean {
  const m = (method || "GET").toUpperCase();
  // Wave 3: worker task detail + own-report read — RBAC enforced in route handlers; lite middleware only gates surface area.
  if (m === "GET" && /^\/api\/v1\/tasks\/[^/]+$/.test(pathname)) return true;
  if (m === "GET" && /^\/api\/v1\/reports\/[^/]+$/.test(pathname)) return true;
  // Worker/iOS+Android lite apps list tenant projects (tenant-scoped; same as dashboard read).
  if (pathname === "/api/v1/projects" && method === "GET") return true;
  if (pathname === "/api/v1/config") return true;
  if (pathname.startsWith("/api/v1/worker")) return true;
  if (pathname.startsWith("/api/v1/sync")) return true;
  if (pathname.startsWith("/api/v1/media/upload-sessions")) return true;
  if (pathname.startsWith("/api/v1/devices")) return true;
  if (pathname.startsWith("/api/v1/auth")) return true;
  if (/^\/api\/v1\/reports\/[^/]+\/analysis-status$/.test(pathname)) return true;
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
 */
export function checkLiteAllowList(
  pathname: string,
  method: string,
  xClient: string | null
): { status: 403; body: { error: string; code: string } } | null {
  if (!isLiteClient(xClient)) return null;
  const m = (method || "GET").toUpperCase();
  if (pathname.startsWith("/api/v1") && !isPathAllowed(pathname, m)) {
    return {
      status: 403,
      body: { error: "forbidden", code: "lite_client_path_forbidden" },
    };
  }
  return null;
}
