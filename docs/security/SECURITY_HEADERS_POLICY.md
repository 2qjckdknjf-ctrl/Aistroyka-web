# Security headers policy

**Source of truth:** `apps/web/lib/security-headers.ts`  
**Application:** `apps/web/middleware.ts` (auth, short-circuit JSON) + `apps/web/next.config.js` `headers()` (route handlers on Cloudflare OpenNext).

OpenNext/Workers does not always attach headers from `NextResponse.next()` in middleware onto API route responses; `next.config` `headers()` is the reliable path for `/api/*`. Middleware still applies page headers on HTML redirects and short-circuit 403/owner denials.

## Profiles

| Profile | Routes | Headers |
|---------|--------|---------|
| **page** | HTML/App Router pages (`/`, `/[locale]/*`, redirects) | CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, HSTS (production only) |
| **api** | `/api/*` including `/api/v1/*` | nosniff, Referrer-Policy, X-Frame-Options DENY, Permissions-Policy — **no CSP** |

API responses omit CSP so JSON clients and mobile fetch are not blocked by document-oriented directives.

## Verification

```bash
# Production (default)
bash scripts/smoke/security_headers.sh

# Staging
SECURITY_HEADERS_BASE_URL=https://staging.aistroyka.ai bash scripts/smoke/security_headers.sh
```

Unit tests: `apps/web/lib/security-headers.test.ts`

## CI

- PR **CI Check** runs the smoke script against `https://www.aistroyka.ai` (read-only public routes).
- Post-deploy prod workflow may add the same gate after soak period.

## Change process

1. Edit `security-headers.ts` only.
2. Update `security-headers.js` CJS shim (required for any future next.config usage).
3. Run unit tests + `security_headers.sh` against staging before merge.
