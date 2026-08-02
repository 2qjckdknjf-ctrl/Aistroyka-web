# Security headers policy

**Source of truth:** `apps/web/lib/security-headers.ts`  
**Application:**

| Surface | Mechanism |
|---------|-----------|
| HTML pages | `apps/web/middleware.ts` (OpenNext `middleware/handler.mjs` on Workers) |
| `/api/v1/*` (most routes) | `apps/web/worker-bootstrap.js` wraps Worker `fetch` — OpenNext **bypasses** middleware for these paths |
| OpenNext duplicate collapse | `worker-bootstrap.js` `collapseDuplicatedSecurityHeaders` (identical comma-joined values only; keep in sync with `security-headers.ts`) |
| Short-circuit JSON (403, owner deny) | `middleware.ts` on synthetic `Response` |
| Static assets only | `apps/web/next.config.js` `headers()` via `buildNextConfigStaticHeaderRules` — **not** page/API |

**Note:** Vercel is not the canonical production runtime. Do not treat Vercel header behavior as Cloudflare proof.

Do not route all traffic through a single catch-all middleware matcher on Workers; that regressed HTML SSR (prod incident 2026-06-17). Keep the pre-P0 split matcher (`api` excluded + `/api/v1/:path*`) and exclude all `/_next/*`.

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
