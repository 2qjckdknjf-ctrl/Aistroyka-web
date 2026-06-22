# Security Safe Next Slice Plan

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Recommended Next Small PR

After PR #109 merges and `main` validation passes, the safest security follow-up is:

**API security header coverage verification/fix for Cloudflare/OpenNext, without auth/RBAC changes.**

This is the smallest branch-derived concern with a concrete hypothesis: middleware `NextResponse.next()` may not attach headers to all API route responses under OpenNext/Workers, so API headers may need platform-level `headers()` or equivalent.

## Proposed Scope

Allowed future slice:

- verify actual API/page header behavior on local build and Cloudflare preview/staging
- if failing, add minimal API header application path
- keep source of truth in `apps/web/lib/security-headers.ts`
- update tests and `docs/security/SECURITY_HEADERS_POLICY.md`
- run `scripts/smoke/security_headers.sh`

## Expected Files If Approved Later

Possible future files:

- `apps/web/lib/security-headers.ts`
- `apps/web/lib/security-headers.test.ts`
- `apps/web/app/api/security-headers.test.ts`
- `apps/web/next.config.js` only if required for Cloudflare/OpenNext
- `docs/security/SECURITY_HEADERS_POLICY.md`
- `scripts/smoke/security_headers.sh`

Avoid in first slice:

- auth callback changes
- tenant RBAC changes
- owner gate changes
- system key logic changes
- middleware matcher changes unless proven required
- package/lockfile/tooling churn

## Required Tests

- unit tests for page/API header profiles
- smoke for public page headers
- smoke for `/api/*` headers
- build and `cf:build`
- no CSP on API responses
- HSTS only where appropriate for production profile

## Deferred

Remain deferred:

- broad middleware matcher refactor
- auth callback/tenant route changes
- owner gate changes
- system route changes
- sync security branch work
- stale broad system maturity branch

## No Broad Merge Rule

Broad middleware/security merge safe: NO.

Reason: branches mix platform-sensitive middleware/header behavior with package churn, stale auth/API changes, migration changes, and broad system refactors.

## Slice Verdict

Next safe slice: API security header coverage verification/fix after PR #109 merge.

Safe before PR #109 merges: NO.
