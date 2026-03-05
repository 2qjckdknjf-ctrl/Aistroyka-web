/**
 * Debug flags. Strict gating: in production requires DEBUG_* AND host in ALLOW_DEBUG_HOSTS.
 * No secrets. Used by _debug and diag routes only.
 */

export interface DebugConfig {
  debugAuth: boolean;
  debugDiag: boolean;
}

export function getDebugConfig(): DebugConfig {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const isProduction = nodeEnv === "production";
  const enableDiagRoutes = process.env.ENABLE_DIAG_ROUTES === "true";
  return {
    debugAuth: process.env.DEBUG_AUTH === "true" || enableDiagRoutes || !isProduction,
    debugDiag: process.env.DEBUG_DIAG === "true" || enableDiagRoutes || !isProduction,
  };
}

const MAX_DEBUG_HOST_LENGTH = 256;

/**
 * True only when request host is allowed. When ALLOW_DEBUG_HOSTS is set, enforce it in all
 * environments (including development/staging). When unset: production => false, non-production => true.
 */
export function isDebugAllowedForRequest(request?: Request): boolean {
  const allowlist = (process.env.ALLOW_DEBUG_HOSTS ?? "").trim();
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const isProduction = nodeEnv === "production";

  if (!allowlist) {
    return !isProduction;
  }
  const host = request?.headers.get("host") ?? "";
  if (!host || host.length > MAX_DEBUG_HOST_LENGTH) {
    return false;
  }
  const normalizedHost = host.split(":")[0].toLowerCase();
  const allowed = allowlist.split(",").map((h) => h.trim().toLowerCase().split(":")[0]).filter(Boolean);
  return allowed.includes(normalizedHost);
}

export function isDebugAuthAllowed(request?: Request): boolean {
  return getDebugConfig().debugAuth && isDebugAllowedForRequest(request);
}

export function isDebugDiagAllowed(request?: Request): boolean {
  return getDebugConfig().debugDiag && isDebugAllowedForRequest(request);
}
