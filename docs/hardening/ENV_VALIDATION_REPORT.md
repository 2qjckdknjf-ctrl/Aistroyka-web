# Env validation report

**Branch:** hardening/dashboard-auth-middleware-sweep

## Critical env for auth/dashboard

| Variable | Used by | Validation / behavior |
|----------|--------|------------------------|
| NEXT_PUBLIC_SUPABASE_URL | createClient, middleware, health | getPublicConfig() returns "" if missing; hasSupabaseEnv() checks both URL and key. Middleware returns 503 in dev/preview if missing; in production logs and continues with null user. |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | createClient, middleware, health | Same as above. No throw from config; createClient uses empty string only if env missing, which can cause Supabase client to throw on first request — layout/middleware now catch and redirect or return null user. |
| SUPABASE_SERVICE_ROLE_KEY | getAdminClient(), health (optional), job processing | getServerConfig(); used server-side only. Missing → getAdminClient() returns null; routes check and return 503 or skip admin path. |

## Current behavior

- **getPublicConfig()** (lib/config/public.ts): Never throws; returns empty strings for missing NEXT_PUBLIC_*.
- **hasSupabaseEnv()**: Used in middleware; if false, middleware returns 503 in dev/preview or logs and returns null user in production.
- **createClient()** / **getSessionUser()**: If createClient() throws (e.g. invalid URL/key), layout and API routes that use try/catch or getSessionUser avoid leaking exception; getSessionUser never throws.

## Recommendations

- **P1:** At app startup or first request, log a single warning if hasSupabaseEnv() is false in production (already partially done in middleware). Do not expose keys.
- **P2:** Optional: assert hasSupabaseEnv() in a server-only init path and fail fast with a clear message in CI/staging; keep production behavior defensive (redirect/null user) to avoid 500.
