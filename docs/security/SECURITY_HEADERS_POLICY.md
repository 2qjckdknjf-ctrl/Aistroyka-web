# Security headers policy

**Source of truth (values):** `apps/web/lib/security-headers.ts`  
**CJS shim for Next config:** `apps/web/lib/security-headers.js` (keep parity with TS)

**Application (owners):**

| Surface | Mechanism |
|---------|-----------|
| HTML pages + middleware redirects | **`apps/web/next.config.js` `headers()`** — sole owner of page/document security headers (CSP, XFO, nosniff, Referrer-Policy, Permissions-Policy, HSTS in production) |
| `/api/v1/*` (most routes on Workers) | `apps/web/worker-bootstrap.js` wraps Worker `fetch` with `Headers.set` — OpenNext **bypasses** middleware for these paths; `next.config.js` also declares `/api/:path*` API headers |
| Short-circuit JSON (403, owner deny) | `middleware.ts` applies **API** headers only via `applyApiSecurityHeadersToHeaders` |
| Middleware page responses | Must **not** re-apply page security headers (dual owners produce Cloudflare joined duplicates such as `nosniff, nosniff`) |

Do not route all traffic through a single catch-all middleware matcher on Workers; that regressed HTML SSR (prod incident 2026-06-17). Keep the pre-P0 split matcher (`api` excluded + `/api/v1/:path*`) and exclude all `/_next/*`.

## Profiles

| Profile | Routes | Headers |
|---------|--------|---------|
| **page** | HTML/App Router pages (`/`, `/[locale]/*`, redirects) | CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, HSTS (production only) |
| **api** | `/api/*` including `/api/v1/*` | nosniff, Referrer-Policy, X-Frame-Options DENY, Permissions-Policy — **no CSP** |

API responses omit CSP so JSON clients and mobile fetch are not blocked by document-oriented directives.

## Dual-owner incident (2026-08)

Production post-deploy smoke failed when both `next.config.js` and `middleware.ts` set the same page headers. Cloudflare/OpenNext joined identical values. Fix: keep `next.config.js` as the only page-header owner; middleware retains auth/session, locale, platform-admin gates, `X-Aistroyka-*`, `X-Auth-Redirect`, cache-control, and API hardening only.

## Verification

```bash
# Production (default)
bash scripts/smoke/security_headers.sh

# Staging
SECURITY_HEADERS_BASE_URL=https://staging.aistroyka.ai bash scripts/smoke/security_headers.sh

# Local mock (joined-duplicate regression)
python3 scripts/smoke/security_headers_mock_host.py ok
python3 scripts/smoke/security_headers_mock_host.py joined-duplicates
```

Unit/contract tests: `apps/web/lib/security-headers.test.ts`, `apps/web/lib/security-headers-ownership.test.ts`, `apps/web/middleware.security-headers.test.ts`, `apps/web/lib/ops/deploy-workflow.contract.test.ts`

## CI

- PR **CI Check** runs the smoke script against `https://www.aistroyka.ai` (read-only public routes).
- Post-deploy prod workflow may add the same gate after soak period.

## Change process

1. Edit `security-headers.ts` only for header **values**.
2. Update `security-headers.js` CJS shim (required for `next.config.js`).
3. Do **not** re-add page headers in `middleware.ts`.
4. Run unit tests + `security_headers.sh` / mock-host modes against staging before merge.
