/**
 * When `OWNER_GATE_SECRET` is set together with `OWNER_GATE_SECRET_CRITICAL_ONLY=1`,
 * the header is required only for `/api/v1/owner/critical/*` (mutations behind step-up).
 * All other owner APIs still require session + role + other hardening.
 *
 * Without `OWNER_GATE_SECRET_CRITICAL_ONLY`, every `/api/v1/owner/*` request must send `X-Owner-Key`
 * when the secret is configured. Owner HTML pages never require this header (use a proxy if needed).
 */

export function isOwnerApiSecretRequired(pathname: string): boolean {
  const criticalOnly = process.env.OWNER_GATE_SECRET_CRITICAL_ONLY === "1";
  if (!criticalOnly) return true;
  return (
    pathname.startsWith("/api/v1/owner/critical/") ||
    pathname.startsWith("/api/v1/platform/critical/")
  );
}
