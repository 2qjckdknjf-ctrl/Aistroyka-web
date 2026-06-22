# Release/Ops Manual Comparison — 2026-06-20

Base: `origin/main` at `ff537c8dec1d9dcdd7ef834894951e625aa97a87`.

No direct branch merges or cherry-picks were used.

## hotfix/middleware-matcher-and-headers

- Ref reviewed: `hotfix/middleware-matcher-and-headers` (local ref; no `origin/hotfix/middleware-matcher-and-headers` present)
- Ahead/behind against `origin/main`: 1 ahead, 11 behind
- Key commit: `0150f0be` — `hotfix: exclude _next/data from middleware; restore CF API headers`

### Files Changed
- `.github/workflows/deploy-cloudflare-prod.yml`
- `apps/web/middleware.ts`
- `apps/web/next.config.js`
- `docs/security/SECURITY_HEADERS_POLICY.md`

### Release/Ops Files Changed
- `.github/workflows/deploy-cloudflare-prod.yml`
- `docs/security/SECURITY_HEADERS_POLICY.md`

### Middleware/Security Files Changed
- `apps/web/middleware.ts`
- `apps/web/next.config.js`
- `docs/security/SECURITY_HEADERS_POLICY.md`

### Config/Env Files Changed
- `apps/web/next.config.js`

### CI/Workflow Files Changed
- `.github/workflows/deploy-cloudflare-prod.yml`

### Smoke/Release Scripts Changed
- None.

### Docs Changed
- `docs/security/SECURITY_HEADERS_POLICY.md`

### Risky Files
- `apps/web/middleware.ts`
- `apps/web/next.config.js`
- `.github/workflows/deploy-cloudflare-prod.yml`

### Safe Candidates To Port
- None in this pass. Current `origin/main` already contains security header smoke workflow coverage and security policy docs; middleware behavior remains too sensitive for blind porting.

### Unsafe Candidates To Skip
- Middleware matcher changes.
- API security header runtime behavior changes.
- Next config header/runtime behavior changes.

### Decision
- `manual_review_later`
- Reason: the branch touches middleware and Cloudflare/API header behavior. Current main has newer security-header architecture; do not port without focused auth/API smoke evidence.

## feat/p0-deps-and-security-headers

- Ref reviewed: `feat/p0-deps-and-security-headers` (local ref; no `origin/feat/p0-deps-and-security-headers` present)
- Ahead/behind against `origin/main`: 1 ahead, 12 behind
- Key commit: `8c0905ab` — `fix(p0): single lock strategy and unified security headers`

### Files Changed
- `.github/workflows/deploy-cloudflare-prod.yml`
- `.tool-versions`
- `AGENTS.md`
- `README.md`
- `apps/cloudflare-agent/README.md`
- `apps/web/app/api/security-headers.test.ts`
- `apps/web/bun.lock`
- `apps/web/lib/security-headers.js`
- `apps/web/lib/security-headers.test.ts`
- `apps/web/lib/security-headers.ts`
- `apps/web/middleware.ts`
- `apps/web/next.config.js`
- `apps/web/package-lock.json`
- `docs/security/SECURITY_HEADERS_POLICY.md`
- `package.json`
- package lock files under `packages/*`
- `scripts/smoke/security_headers.sh`

### Release/Ops Files Changed
- `.github/workflows/deploy-cloudflare-prod.yml`
- `scripts/smoke/security_headers.sh`
- `docs/security/SECURITY_HEADERS_POLICY.md`
- `package.json`

### Middleware/Security Files Changed
- `apps/web/lib/security-headers.ts`
- `apps/web/lib/security-headers.js`
- `apps/web/lib/security-headers.test.ts`
- `apps/web/app/api/security-headers.test.ts`
- `apps/web/middleware.ts`
- `apps/web/next.config.js`

### Config/Env Files Changed
- `.tool-versions`
- `package.json`
- lockfiles

### CI/Workflow Files Changed
- `.github/workflows/deploy-cloudflare-prod.yml`

### Smoke/Release Scripts Changed
- `scripts/smoke/security_headers.sh`

### Docs Changed
- `docs/security/SECURITY_HEADERS_POLICY.md`
- `README.md`
- `AGENTS.md`
- `apps/cloudflare-agent/README.md`

### Risky Files
- `apps/web/middleware.ts`
- `apps/web/next.config.js`
- lockfiles/package strategy files
- `apps/web/lib/security-headers.ts`

### Safe Candidates To Port
- None in this pass. Current `origin/main` already contains:
  - root `smoke:security-headers` script
  - `scripts/smoke/security_headers.sh`
  - `docs/security/SECURITY_HEADERS_POLICY.md`
  - post-deploy `security-headers-smoke` workflow job
  - page/API security-header profiles in `apps/web/lib/security-headers.ts`

### Unsafe Candidates To Skip
- Middleware rewrite.
- Next config security header rewrite.
- Lockfile/package strategy changes.
- CJS/TS security header implementation changes unless a focused test proves current main is missing behavior.

### Decision
- `already_represented_or_manual_review_later`
- Reason: safe release/ops benefits appear already in main; remaining branch delta is high-risk runtime/package churn.

## chore/phase13-operator-refresh

- Ref reviewed: `chore/phase13-operator-refresh` (local ref; no `origin/chore/phase13-operator-refresh` present)
- Ahead/behind against `origin/main`: 1 ahead, 18 behind
- Key commit: `72ef0222` — `chore: operator tooling, legacy API inventory, doc refresh`

### Files Changed
- `apps/web/app/api/tenant/members/route.ts`
- `docs/audit/DEEP_AUDIT_RISK_REGISTER.md`
- `docs/audit/LEGACY_API_SURFACE_INVENTORY.md`
- `docs/ops/POST_MERGE_GOVERNANCE_CHECKLIST.md`
- `docs/product/PHASE13_ROADMAP_CLOSURE.md`
- `ios/README.md`
- `scripts/smoke/check_pilot_prereqs.sh`
- `scripts/verify/stakeholder_finance_sanity.sh`

### Release/Ops Files Changed
- `docs/audit/DEEP_AUDIT_RISK_REGISTER.md`
- `docs/audit/LEGACY_API_SURFACE_INVENTORY.md`
- `docs/ops/POST_MERGE_GOVERNANCE_CHECKLIST.md`
- `docs/product/PHASE13_ROADMAP_CLOSURE.md`
- `scripts/smoke/check_pilot_prereqs.sh`
- `scripts/verify/stakeholder_finance_sanity.sh`

### Middleware/Security Files Changed
- None.

### Config/Env Files Changed
- Scripts now load repo-root `.env.pilot` when present.

### CI/Workflow Files Changed
- None.

### Smoke/Release Scripts Changed
- `scripts/smoke/check_pilot_prereqs.sh`
- `scripts/verify/stakeholder_finance_sanity.sh`

### Docs Changed
- Legacy API inventory and Phase 13/operator docs.

### Risky Files
- `apps/web/app/api/tenant/members/route.ts` (tenant/API behavior)

### Safe Candidates To Port
- None needed in this pass. Current `origin/main` already includes `.env.pilot` loading and stakeholder smoke messaging in both scripts.

### Unsafe Candidates To Skip
- `apps/web/app/api/tenant/members/route.ts`
- Stale production-build doc refreshes from 2026-06-16

### Decision
- `already_represented_or_manual_review_later`
- Reason: the safe script improvements are already present in current main; the tenant API route is high-risk and deferred.

## Overall Decision
- Product/release code ported: none.
- Docs preserved/created: yes, under `docs/reconciliation/`.
- Release/ops runtime changes remain manual-review-only.
