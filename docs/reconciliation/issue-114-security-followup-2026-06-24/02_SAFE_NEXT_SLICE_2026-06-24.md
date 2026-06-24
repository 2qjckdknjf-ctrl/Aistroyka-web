# Safe Next Slice — Issue #114 Follow-Up

**Date:** 2026-06-24  
**Base `main` SHA:** `260a73b335d75bf3878be16e6360372377e319c4`

## Selected slice (exactly one)

**Title:** Middleware page security header regression tests (test-only)

**Type:** Focused test-only — no production code changes

**Why now:** PR #120 closed the API header coverage gap (#114’s primary recommended slice). The remaining concrete gap on `main` is **middleware page-path** coverage: API paths have 3 middleware tests; HTML routes have zero middleware tests despite CSP/HSTS being applied in `applyPageSecurityHeaders`.

**Why safer than alternatives:**

- No `middleware.ts` edits
- No `next.config.js` / worker-bootstrap changes
- No auth/RBAC/owner gate changes
- No package/lockfile churn
- Mirrors existing `middleware.security-headers.test.ts` API test pattern
- Does not require live smoke or deploy

## Allowed files (implementation PR)

- `apps/web/middleware.security-headers.test.ts` (extend only)

## Forbidden files

- `apps/web/middleware.ts`
- `apps/web/lib/security-headers.ts` (unless test imports only — no production edits)
- `apps/web/worker-bootstrap.js`
- `apps/web/next.config.js`
- `apps/web/lib/supabase/**`
- `apps/web/lib/platform-owner/**`
- `apps/web/supabase/migrations/**`
- `.env*`, deploy workflows, branch protection
- Broad merge of `audit/issue-114-middleware-security-stacked-audit-2026-06-22` or any stale security branch

## Proposed test cases

1. **Public locale page** (`/en`) — response includes `REQUIRED_PAGE_SECURITY_HEADER_KEYS` including CSP; no regression vs lib profile.
2. **Auth page** (`/en/login`) — page headers including CSP on 200 pass-through.
3. **Protected redirect** (`/en/dashboard` unauthenticated) — redirect to login with page security headers on redirect response.

Optional fourth case (if stable in vitest env):

4. **Production HSTS** — when `NODE_ENV=production`, page response includes `Strict-Transport-Security` (mock or env override).

## Validation commands

```bash
bun install --frozen-lockfile
bun run lint
bun run build:contracts
bun run i18n:check
bun run test -- --run apps/web/middleware.security-headers.test.ts
bun run test -- --run
bun run build
bun run cf:build
```

## Acceptance criteria

- All new tests pass without modifying production code
- Existing 3 API middleware header tests unchanged and passing
- Tests assert CSP **present** on page paths and **absent** on API paths (existing API tests)
- Full suite remains 1543+ passing
- CI Check green
- Non-author APPROVED protected merge

## Rollback plan

Revert the single test file commit; no runtime impact.

## Explicitly deferred (not this slice)

- `next.config.js` headers() fallback changes
- Middleware matcher refactor
- Auth callback / tenant RBAC changes
- Owner gate logic changes
- Live staging/production smoke re-run
- Docs update to `SECURITY_HEADERS_POLICY.md` (optional separate docs-only PR)
- Truth index SHA bump (separate docs PR)
