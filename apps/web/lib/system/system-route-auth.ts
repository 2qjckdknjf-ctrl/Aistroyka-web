/**
 * Auth for /api/system/* routes.
 * Production: SYSTEM_API_KEY required; X-System-Key header required.
 * Non-production: allow unauthenticated when SYSTEM_API_KEY not set.
 *
 * Production detection: NODE_ENV (from wrangler vars) or NEXT_PUBLIC_APP_ENV (inlined at build).
 * Cloudflare Workers may not set NODE_ENV; NEXT_PUBLIC_APP_ENV is set in CI before build.
 */

function isProduction(): boolean {
  const nodeEnv = (process.env.NODE_ENV ?? "").trim().toLowerCase();
  const appEnv = (process.env.NEXT_PUBLIC_APP_ENV ?? "").trim().toLowerCase();
  return nodeEnv === "production" || appEnv === "production";
}

export function requireSystemRouteAuth(request: Request): Response | null {
  const key = (process.env.SYSTEM_API_KEY ?? "").trim();

  if (isProduction() && !key) {
    return new Response(
      JSON.stringify({
        error: "ServiceUnavailable",
        code: "system_routes_require_auth",
        message: "SYSTEM_API_KEY must be set in production. Set env and pass X-System-Key header.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!key) return null;

  const provided = request.headers.get("X-System-Key")?.trim();
  if (!provided || provided !== key) {
    return new Response(
      JSON.stringify({ error: "Unauthorized", message: "X-System-Key required" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  return null;
}
