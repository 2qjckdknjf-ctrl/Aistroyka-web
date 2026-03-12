# Debug and diag hardening

## Production default

- **NODE_ENV=production** and no debug flags → `/api/_debug/auth` and `/api/diag/supabase` return **404** (isDebugAuthAllowed / isDebugDiagAllowed false).
- **DEBUG_AUTH**, **DEBUG_DIAG**, or **ENABLE_DIAG_ROUTES** must be explicitly set to enable; and in production, **ALLOW_DEBUG_HOSTS** must be set and request Host must match, or debug remains blocked.

## Guards

1. **getDebugConfig()** — debugAuth/debugDiag true only when DEBUG_AUTH or ENABLE_DIAG_ROUTES (or DEBUG_DIAG for diag), or when not production.
2. **isDebugAllowedForRequest(request)** — when ALLOW_DEBUG_HOSTS is unset, production ⇒ false. When set, request Host (normalized) must be in the comma-separated list.
3. **isDebugAuthAllowed(request)** — getDebugConfig().debugAuth && isDebugAllowedForRequest(request).
4. **isProductionDebugSafe()** — true when not production, or when no debug flags set, or when ALLOW_DEBUG_HOSTS is non-empty when flags are set (used for release validation).

## Routes

- **GET /api/_debug/auth** — gated by isDebugAuthAllowed. Returns cookie/session presence (no tokens).
- **GET /api/diag/supabase** — gated by isDebugDiagAllowed. Returns connectivity (no secrets).

## Security runbook: verify no debug exposure in production

1. Set **NODE_ENV=production** in production; do **not** set DEBUG_AUTH, DEBUG_DIAG, or ENABLE_DIAG_ROUTES (or set them to false/empty).
2. If you must enable debug for one internal host: set **ALLOW_DEBUG_HOSTS** to that host only (e.g. `internal.example.com`). Do not use wildcards or public hostnames.
3. Verify: `curl -s -o /dev/null -w "%{http_code}" https://your-app.com/api/_debug/auth` → **404**.
4. Verify: `curl -s -o /dev/null -w "%{http_code}" https://your-app.com/api/diag/supabase` → **404**.
5. Run release checker (scripts/release-readiness-check) which includes debug surface check.
