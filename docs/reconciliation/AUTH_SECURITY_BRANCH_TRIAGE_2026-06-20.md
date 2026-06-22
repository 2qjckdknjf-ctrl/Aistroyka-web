# Auth / Security / Middleware Branch Triage — 2026-06-20

Base: `origin/main` at `ff537c8dec1d9dcdd7ef834894951e625aa97a87`.

## hotfix/middleware-matcher-and-headers

- Ref reviewed: `hotfix/middleware-matcher-and-headers`
- Ahead/behind: 1 ahead, 11 behind
- Last commit: `0150f0be` — `hotfix: exclude _next/data from middleware; restore CF API headers`
- Changed files:
  - `.github/workflows/deploy-cloudflare-prod.yml`
  - `apps/web/middleware.ts`
  - `apps/web/next.config.js`
  - `docs/security/SECURITY_HEADERS_POLICY.md`

### Review Questions
- Touches middleware: YES.
- Touches auth cookies: POSSIBLE. Middleware changes can affect session/auth route behavior even if cookie code is not directly changed.
- Touches security headers: YES.
- Touches Cloudflare behavior: YES, via deployment workflow and API header behavior.
- Touches tenant access: POSSIBLE. `apps/web/middleware.ts` controls request routing and can affect tenant/dashboard/API access.
- Duplicates existing main behavior: UNKNOWN. All four changed files have main-side drift since merge base, so this must be compared manually against current main.
- Safer than main: UNKNOWN.
- Stale: NO by date, but behind main by 11 commits.
- Could break login/dashboard/API: YES.

### Decision
- Risk: P0.
- Decision: `manual_review_again`.
- Integration method: compare patch manually against current `apps/web/middleware.ts`, `apps/web/lib/security-headers.ts`, `apps/web/next.config.js`, and Cloudflare workflow.
- Do not full-merge.
- Do not cherry-pick blindly.

### Reasoning
The intent looks important: exclude `_next/data` from middleware and restore Cloudflare API headers. The implementation touches the exact surfaces that can silently break login redirects, dashboard reachability, API allow-listing, and security headers. It is a candidate for reimplementation or selected patch extraction only after current main behavior is audited.

## feat/p0-deps-and-security-headers

- Ref reviewed: `feat/p0-deps-and-security-headers`
- Ahead/behind: 1 ahead, 12 behind
- Last commit: `8c0905ab` — `fix(p0): single lock strategy and unified security headers`
- Changed files:
  - `.github/workflows/deploy-cloudflare-prod.yml`
  - `.tool-versions`
  - `AGENTS.md`
  - `README.md`
  - `apps/web/app/api/security-headers.test.ts`
  - `apps/web/lib/security-headers.ts`
  - `apps/web/lib/security-headers.test.ts`
  - `apps/web/middleware.ts`
  - `apps/web/next.config.js`
  - `apps/web/package-lock.json`
  - `package.json`
  - package lock files under packages
  - `scripts/smoke/security_headers.sh`

### Review Questions
- Touches middleware: YES.
- Touches auth cookies: POSSIBLE through middleware behavior.
- Touches security headers: YES.
- Touches Cloudflare behavior: YES, via deploy workflow and header behavior.
- Touches tenant access: POSSIBLE through middleware.
- Duplicates existing main behavior: LIKELY/PARTIAL. Current workspace rules state security headers now have a single source at `apps/web/lib/security-headers.ts`, which overlaps this branch's purpose.
- Safer than main: UNKNOWN.
- Stale: NO by date, but behind main by 12 commits and all changed files have main-side drift.
- Could break login/dashboard/API: YES.

### Decision
- Risk: P0.
- Decision: `manual_review_again`.
- Integration method: do not merge; compare the security header source, smoke script, and middleware matcher against current main and re-apply only missing checks if needed.
- Lockfile/package strategy changes require separate review and should not ride along with middleware/security behavior.

### Reasoning
This branch may contain useful security-header smoke coverage, but it is unsafe as a combined dependency/lockfile/middleware/security header merge. If current main already contains the unified header source, the most likely useful recovery target is selected test/smoke logic, not the whole branch.

## Auth/Security Conclusion
- No auth/security branch is safe for full merge.
- Both branches must be reviewed before any integration branch touches middleware.
- First validation gates if selected patches are later applied:
  - middleware route smoke for public, auth, dashboard, API, and `_next/data`
  - security header smoke
  - Cloudflare build
  - login/dashboard auth smoke
  - tenant API access smoke
