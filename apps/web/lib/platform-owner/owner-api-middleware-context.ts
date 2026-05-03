/**
 * Global API / middleware context (owner hardening pass):
 *
 * - Cloudflare production: `scripts/patch-worker-bypass-api-middleware.cjs` bypasses Next middleware
 *   for most `/api/v1/*` to avoid `middleware-manifest` issues. **`/api/v1/owner/*` is excepted** and
 *   still executes the full middleware gate (session, role, rate limits, optional secret subset).
 * - All other `/api/v1/*` routes must keep **route-level** guards (`requireTenant`, `requireAdmin`,
 *   provider secrets, cron secrets, etc.). Treat “middleware skipped” as a known platform tradeoff.
 */

export const OWNER_API_MIDDLEWARE_EXCEPTION_PATH = "/api/v1/owner";
