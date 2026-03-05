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
  return {
    debugAuth: process.env.DEBUG_AUTH === "true" || !isProduction,
    debugDiag: process.env.DEBUG_DIAG === "true" || !isProduction,
  };
}

const MAX_DEBUG_HOST_LENGTH = 256;

/** In production: true only if DEBUG_* is set AND request host is in ALLOW_DEBUG_HOSTS (comma-separated). */
export function isDebugAllowedForRequest(request?: Request): boolean {
  const cfg = getDebugConfig();
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const isProduction = nodeEnv === "production";
  if (!isProduction) {
    return true;
  }
  const allowlist = process.env.ALLOW_DEBUG_HOSTS ?? "";
  if (!allowlist.trim()) {
    return false;
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
