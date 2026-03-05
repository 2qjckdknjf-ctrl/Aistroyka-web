/**
 * Lite client (ios_lite, android_lite) API path allow-list.
 * Enforce in middleware or route guard; return 403 for disallowed paths.
 */

const LITE_CLIENTS = ["ios_lite", "android_lite"] as const;

function isLiteClient(header: string | null): boolean {
  const v = header?.toLowerCase().trim();
  return v === "ios_lite" || v === "android_lite";
}

/** Allowed path prefixes or exact paths for lite clients. */
function isPathAllowed(pathname: string): boolean {
  if (pathname === "/api/v1/config") return true;
  if (pathname.startsWith("/api/v1/worker")) return true;
  if (pathname.startsWith("/api/v1/sync")) return true;
  if (pathname.startsWith("/api/v1/media/upload-sessions")) return true;
  if (pathname.startsWith("/api/v1/devices")) return true;
  if (pathname.startsWith("/api/v1/auth")) return true;
  if (/^\/api\/v1\/reports\/[^/]+\/analysis-status$/.test(pathname)) return true;
  return false;
}

/**
 * Returns 403 response if request is from a lite client and path is not allowed.
 * Otherwise returns null (caller should proceed).
 */
export function checkLiteAllowList(
  pathname: string,
  xClient: string | null
): { status: 403; body: { error: string; code: string } } | null {
  if (!isLiteClient(xClient)) return null;
  if (pathname.startsWith("/api/v1") && !isPathAllowed(pathname)) {
    return {
      status: 403,
      body: { error: "forbidden", code: "lite_client_path_forbidden" },
    };
  }
  return null;
}
