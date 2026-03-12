# Observability notes (dashboard / auth)

**Branch:** hardening/dashboard-auth-middleware-sweep

## Current logging

- **Dashboard layout:** In `NODE_ENV !== "production"`: `[dashboard layout] SSR started`, `auth resolved`, `auth failed`, `no user redirecting`, `requireAdmin resolved`, `requireAdmin failed`, `unexpected error`. No user IDs or tokens.
- **Middleware:** On missing Supabase env in production: `[auth] updateSession: missing Supabase env in production`. No secrets.
- **Health route:** On getHealthResponse throw or validation failure: `[v1/health] getHealthResponse threw` / `response contract validation failed` (not in test). No secrets.

## Safe practices

- No tokens, no full user objects, no secrets in logs.
- Structured prefixes (`[dashboard layout]`, `[auth]`, `[v1/health]`) for grep.
- Production: only error-path or env-missing logs; success-path logs are dev-only to avoid spam.

## Optional production diagnostics

If needed for debugging production dashboard issues:

- Gate behind env flag (e.g. `LOG_DASHBOARD_SSR=true`).
- Log only: route key, locale, auth outcome (ok / null / error), requireAdmin outcome, no PII.
- Use a single structured logger if the app introduces one (e.g. JSON with level, message, context).
