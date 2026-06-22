# Security Headers Review

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Current Security Header State

Current source of truth:

- `apps/web/lib/security-headers.ts`

Current page profile includes:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Content-Security-Policy`
- `Permissions-Policy`
- `Strict-Transport-Security` on production page responses when middleware applies page headers

Current API profile helper includes:

- `X-Content-Type-Options`
- `Referrer-Policy`
- `X-Frame-Options`
- `Permissions-Policy`
- no CSP

## Current Tests

Existing tests cover:

- page profile required keys
- API profile omits CSP but keeps hardening headers
- `nosniff`
- `X-Frame-Options: DENY`
- route policy expectations

## Branch Differences

`feat/p0-deps-and-security-headers` has already contributed much of the page/API profile split that exists in PR #109. However, the branch is not safe to merge because it also includes lockfile/package/tooling churn.

`hotfix/middleware-matcher-and-headers` proposes documenting that OpenNext/Workers may not reliably attach middleware `NextResponse.next()` headers to API route responses, and suggests `next.config.js headers()` for `/api/*`. This may be a valid future slice, but it changes runtime header application and must be tested separately.

## Cloudflare / Vercel / Next Implications

Risks:

- Middleware-set headers may not attach to all API route responses in OpenNext/Cloudflare.
- `next.config.js headers()` may behave differently under Vercel vs OpenNext/Cloudflare.
- Adding CSP to API responses can break clients; API profile intentionally omits CSP.
- HSTS must be production-only and should not be tested only locally.

## Broad Header Merge Risk

Broad header merge safe: NO.

Reasons:

- Header behavior is platform-sensitive.
- Branches mix middleware, config, docs, package, and workflow changes.
- Security headers need smoke evidence against Cloudflare production/staging routes.

## Header Verdict

Header changes safe now: PARTIAL.

The likely safe next slice is an API security-header coverage audit/fix that touches only `security-headers`, `next.config.js`/middleware as required, tests, docs, and the `security_headers.sh` smoke, after PR #109 merges.
