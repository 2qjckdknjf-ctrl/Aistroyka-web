# P0/P1 Integration Decision — 2026-06-20

Base: `origin/main` at `ff537c8dec1d9dcdd7ef834894951e625aa97a87`.

## Final Decision Table

| Branch | Category | Risk | Main status | Decision | Why | Integration method | Required validation | Blockers |
|---|---|---|---|---|---|---|---|---|
| `ai/gold-memory-mvp` | AI | P0 | PARTIAL | `manual_review_again` | Broad AI + frontend + migrations + tenant/admin scope; not isolated Gold Memory. | Module-by-module compare; selected AI commits only after schema/RLS review. | migration sanity, RLS review, AI tests, flags, `cf:build`, live AI smoke. | migrations, tenant data access, provider/env, overlap with other AI/design branches. |
| `ai/expert-review-queue-mvp` | AI | P0 | PARTIAL | `manual_review_again` | Real queue work, but depends on tenant APIs, admin access, flags, migrations, and AI Flywheel foundation. | Integrate only after AI foundation; cherry-pick queue module if accepted. | migration sanity, admin RBAC, queue tests, tenant API tests, `cf:build`. | internal/admin-only data access, migration ordering, Gold Memory dependency. |
| `ai/flywheel-final-tail-closure` | AI | P0 | PARTIAL | `manual_review_again` | Small commit count but foundational AI feedback/consent/migration surface. | Review as AI foundation candidate before Gold Memory/Expert Review. | migration sanity, feedback route tests, PII/finance guards, flags, live AI smoke. | migration/RLS, data capture consent, provider/env. |
| `hotfix/middleware-matcher-and-headers` | Auth/security | P0 | UNKNOWN/PARTIAL | `manual_review_again` | Middleware/security/deploy behavior can break login, dashboard, API, and Cloudflare headers. | Manual patch compare against current main; reimplement missing fix if needed. | middleware smoke, login/dashboard smoke, API smoke, security header smoke, `cf:build`. | current main drift in all changed files. |
| `feat/p0-deps-and-security-headers` | Auth/security | P0 | UNKNOWN/PARTIAL | `manual_review_again` | Combines security headers, middleware, workflows, packages/lockfiles. | Split: consider tests/smoke/header logic only; do not merge package strategy blindly. | install, lock validation, header tests, smoke, `cf:build`. | lockfile churn, middleware drift, duplicate current main behavior. |
| `release/web-pilot-rc` | Frontend/design | P0 | NO/PARTIAL | `cherry_pick_later` | Strongest source of missing visible frontend work, but broad and includes AI/API/migration-sensitive paths. | Select frontend/design commits/file groups after API/auth/customer-finance review. | i18n, lint/typecheck, route smoke, auth/role smoke, web build, `cf:build`. | API compatibility, auth/role gates, customer finance isolation. |
| `design/liquid-glass-public-shell-lg2a` | Frontend/design | P0 | NO/PARTIAL | `manual_review_again` | Useful Liquid Glass source, but also includes AI/migrations despite public-shell name. | Compare against `release/web-pilot-rc`; extract only non-duplicated design pieces. | i18n, design tests, public route smoke, web build, `cf:build`. | overlap with `release/web-pilot-rc`, AI migration scope. |
| `feature/unified-product-design-certification` | Frontend/design/mobile | P0 | NO/PARTIAL | `manual_review_again` | Very broad certification branch across web, mobile, AI, docs, and build config. | Use as evidence/source only; prefer narrower web/mobile branches for recovery. | full module-specific gates if any selected change is used. | 721 changed files, mobile build configs, AI/migrations, RBAC/docs scope. |
| `release/mobile-pilot-rc` | Mobile | P0 | NO/PARTIAL | `manual_review_again` | Real mobile pilot work, but includes signing/build config and web/backend/AI-adjacent changes. | Separate mobile integration group after backend/frontend decisions. | iOS build/UITest, Android bundle, no secrets, mobile API smoke. | signing config, Android secrets handling, API compatibility. |
| `chore/phase13-operator-refresh` | Ops/unknown | P0 | UNKNOWN/PARTIAL | `manual_review_again` | Useful operator/docs/scripts, but includes tenant members API route. | Split docs/scripts from tenant API route review. | tenant API tests, stakeholder finance sanity, smoke script validation. | auth/tenant route behavior drift. |
| `cursor-test` | Ops/unknown | P3 | NO UNIQUE WORK | `ignore_archive` | No commits ahead of main; 490 behind; stale test branch. | None. | None. | None. |

## Updated Recommended Integration Order

### 1. Release/Ops Safe Foundations
Candidate branches:
- `hotfix/middleware-matcher-and-headers` — manual patch compare only.
- `feat/p0-deps-and-security-headers` — possible selected security header tests/smoke only.
- `chore/phase13-operator-refresh` — docs/scripts only after splitting from tenant API route.

Validation:
- install/lock validation if package files change
- middleware smoke
- security header smoke
- Cloudflare build
- login/dashboard/API smoke

### 2. Database / Contracts
Candidate branches:
- `ai/flywheel-final-tail-closure`
- `ai/gold-memory-mvp`
- `ai/expert-review-queue-mvp`

Validation:
- migration ordering review
- Supabase active project sanity
- RLS/customer finance isolation review
- no migration apply without separate approval

### 3. Backend / API
Candidate branches:
- AI branches above, but only after database decision.
- `chore/phase13-operator-refresh` tenant route only after auth review.

Validation:
- route tests
- tenant/auth tests
- API smoke
- contracts build if contracts change

### 4. AI
Candidate branches:
- `ai/flywheel-final-tail-closure` first
- `ai/gold-memory-mvp` second
- `ai/expert-review-queue-mvp` third

Validation:
- AI unit tests
- flags off by default where appropriate
- PII/finance guards
- `bash scripts/smoke/ai_live_provider.sh --require-live` before any live AI claim

### 5. Frontend / Design
Candidate branches:
- `release/web-pilot-rc` as primary source for visible missing web work.
- `design/liquid-glass-public-shell-lg2a` only for missing Liquid Glass pieces after comparison.
- `feature/unified-product-design-certification` only as a reference/source branch, not direct integration.

Validation:
- i18n check
- lint/typecheck
- public/dashboard/owner/client route smoke
- auth/role checks
- customer finance isolation
- web build and Cloudflare build

### 6. Mobile
Candidate branches:
- `release/mobile-pilot-rc`

Validation:
- iOS build and UITest smoke
- Android build/bundle
- no committed signing secrets
- mobile API smoke

### 7. Docs Cleanup
Candidate branches:
- Docs from AI/design/mobile branches only after code decisions are made.

Validation:
- docs must reflect code actually integrated into the integration branch.

## Final Integration Posture
- Safe to merge anything into main now: NO.
- Safe to create integration branch now: YES, if it starts with docs/ops comparison and no product code changes are applied without review.
- First safe group: manual review/reimplementation of release/ops foundations, not direct branch merge.
