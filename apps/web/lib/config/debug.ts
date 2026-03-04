/**
 * Debug flags. Strict gating: only non-production or explicit DEBUG_*.
 * No secrets. Used by _debug routes only.
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

export function isDebugAuthAllowed(): boolean {
  return getDebugConfig().debugAuth;
}

export function isDebugDiagAllowed(): boolean {
  return getDebugConfig().debugDiag;
}
