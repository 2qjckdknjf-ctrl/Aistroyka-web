/**
 * Diag/diagnostic routes gate. In production, diagnostic endpoints return 404 unless
 * ENABLE_DIAG_ROUTES=true. In non-production they are allowed.
 */

export function isDiagEnabled(): boolean {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  if (nodeEnv !== "production") return true;
  return process.env.ENABLE_DIAG_ROUTES === "true";
}
