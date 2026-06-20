# P0/P1 Branch Triage — 2026-06-20

Base: `origin/main` at `ff537c8dec1d9dcdd7ef834894951e625aa97a87`.

## ai/gold-memory-mvp
- Ref reviewed: `origin/ai/gold-memory-mvp`
- Ahead/behind: 39 ahead, 5 behind
- Last commit: `98a068c1` — 2026-06-19 — `Design: complete Liquid Glass public site redesign (#107)`
- Main changed areas: frontend, backend, AI, mobile, migrations, release/ops, docs, tests
- Key files changed: `apps/web/lib/platform/ai-flywheel/gold-memory/*`, `apps/web/lib/platform/ai-flywheel/*`, `apps/web/app/api/v1/tenant/ai-expert-review-queue/*`, `apps/web/app/api/v1/tenant/ai-training-consent/route.ts`, `apps/web/supabase/migrations/20260617140000_ai_gold_memory.sql`, public Liquid Glass pages/components
- Key commits: `98a068c1`, `68be705a`, `609bbd62`, `e38d07c1`, `d5350cfc`, `51a06788`, `94eb5ded`, `387c7650`
- Appears stale: NO
- Overlaps with newer work: YES by scope, even though changed-path overlap from merge-base to main is low; this branch contains design and AI work that is also represented in other candidate branches.
- Contains migrations: YES
- Touches auth/tenant/security: YES
- Touches production deploy config: NO
- Touches mobile build configs: NO
- Risk level: P0
- Recommendation: `manual_compare_required`
- Reasoning: This branch is not an isolated Gold Memory branch anymore. It contains broad Liquid Glass frontend, AI Flywheel, Expert Review Queue, tenant AI endpoints, migrations, iOS feedback, scripts, and docs. Do not merge fully. Compare module-by-module and only consider selected AI commits after migration and RLS review.

## ai/expert-review-queue-mvp
- Ref reviewed: `origin/ai/expert-review-queue-mvp`
- Ahead/behind: 12 ahead, 5 behind
- Last commit: `498b6743` — 2026-06-17 — `docs(ai-flywheel): record PR #105 reconciliation into ai/gold-memory-mvp`
- Main changed areas: frontend, backend, AI, mobile, migrations, release/ops, docs, tests
- Key files changed: `apps/web/app/[locale]/(dashboard)/admin/ai/expert-review/*`, `apps/web/app/api/v1/tenant/ai-expert-review-queue/*`, `apps/web/lib/platform/ai-flywheel/expert-review-queue/*`, `apps/web/supabase/migrations/20260617160000_ai_expert_review_queue.sql`
- Key commits: `498b6743`, `1ef43915`, `44e6db1e`, `268f3dff`, `9baceb73`, `0c61b4aa`, `9db47fa0`, `684edd65`
- Appears stale: NO
- Overlaps with newer work: YES by dependency chain with Gold Memory/Flywheel branches.
- Contains migrations: YES
- Touches auth/tenant/security: YES
- Touches production deploy config: NO
- Touches mobile build configs: NO
- Risk level: P0
- Recommendation: `manual_compare_required`
- Reasoning: The branch adds a real Expert Review Queue admin/API/service stack, but it depends on tenant access, AI training consent, migrations, flags, observability, and Gold Memory flow. It is unsafe as a full merge; cherry-pick only after schema and route review.

## ai/flywheel-final-tail-closure
- Ref reviewed: `origin/ai/flywheel-final-tail-closure`
- Ahead/behind: 2 ahead, 5 behind
- Last commit: `20b4f3f7` — 2026-06-17 — `docs(ai-flywheel): record CI cf:build proof on closure SHA`
- Main changed areas: frontend, backend, AI, mobile, migrations, release/ops, docs, tests
- Key files changed: `apps/web/app/api/v1/ai/feedback/route.ts`, `apps/web/app/api/v1/tenant/ai-training-consent/route.ts`, `apps/web/lib/features/ai/api/submitAiFeedback.ts`, `apps/web/lib/platform/ai-flywheel/*`, `apps/web/supabase/migrations/20260617120000_ai_flywheel_foundation.sql`
- Key commits: `20b4f3f7`, `7b5654a0`
- Appears stale: NO
- Overlaps with newer work: YES by dependency chain with later Gold Memory and Expert Review Queue branches.
- Contains migrations: YES
- Touches auth/tenant/security: YES
- Touches production deploy config: NO
- Touches mobile build configs: NO
- Risk level: P0
- Recommendation: `manual_compare_required`
- Reasoning: Small commit count but high blast radius. It is likely a tail/closure branch for the AI Flywheel foundation, not a standalone feature branch. Integrate only after validating migration state and feedback route behavior.

## hotfix/middleware-matcher-and-headers
- Ref reviewed: `hotfix/middleware-matcher-and-headers`
- Ahead/behind: 1 ahead, 11 behind
- Last commit: `0150f0be` — 2026-06-17 — `hotfix: exclude _next/data from middleware; restore CF API headers`
- Main changed areas: release/ops, docs
- Key files changed: `.github/workflows/deploy-cloudflare-prod.yml`, `apps/web/middleware.ts`, `apps/web/next.config.js`, `docs/security/SECURITY_HEADERS_POLICY.md`
- Key commits: `0150f0be`
- Appears stale: NO
- Overlaps with newer work: YES, all 4 files have main-side drift since the merge base.
- Contains migrations: NO
- Touches auth/tenant/security: YES
- Touches production deploy config: YES
- Touches mobile build configs: NO
- Risk level: P0
- Recommendation: `manual_compare_required`
- Reasoning: This is exactly the class of change that can fix or break dashboard/login/API behavior. It must be compared against current `apps/web/middleware.ts`, security header source of truth, and Cloudflare deployment workflow before any integration.

## feat/p0-deps-and-security-headers
- Ref reviewed: `feat/p0-deps-and-security-headers`
- Ahead/behind: 1 ahead, 12 behind
- Last commit: `8c0905ab` — 2026-06-17 — `fix(p0): single lock strategy and unified security headers`
- Main changed areas: frontend, backend, release/ops, docs, tests
- Key files changed: `.github/workflows/deploy-cloudflare-prod.yml`, `apps/web/lib/security-headers.ts`, `apps/web/middleware.ts`, `apps/web/next.config.js`, `scripts/smoke/security_headers.sh`, package lock files
- Key commits: `8c0905ab`
- Appears stale: NO
- Overlaps with newer work: YES, all 19 changed files have main-side drift since merge base.
- Contains migrations: NO
- Touches auth/tenant/security: YES
- Touches production deploy config: YES
- Touches mobile build configs: NO
- Risk level: P0
- Recommendation: `manual_compare_required`
- Reasoning: Contains potentially important security-header consolidation, but also lockfile/package strategy changes and middleware changes. Do not merge fully; compare current main security-header architecture first.

## release/web-pilot-rc
- Ref reviewed: `origin/release/web-pilot-rc`
- Ahead/behind: 23 ahead, 0 behind
- Last commit: `9d6a7812` — 2026-06-20 — `design: apply Liquid Glass across web app surfaces`
- Main changed areas: frontend, backend, AI, migrations, release/ops, docs, tests
- Key files changed: dashboard routes, owner/client portal routes, public marketing pages, `apps/web/components/public/*`, `apps/web/components/design/liquid-glass/*`, AI admin panels, API/tenant AI routes
- Key commits: `9d6a7812`, `3331db77`, `2110f674`, `0f185198`, `7d2c8c57`, `b5a67ea9`, `6e0b848b`, `1fc996ab`, `3d50a8f9`, `7a70f85b`
- Appears stale: NO
- Overlaps with newer work: YES by product scope; this branch is newer than main and likely explains missing visible frontend work.
- Contains migrations: YES
- Touches auth/tenant/security: YES
- Touches production deploy config: NO
- Touches mobile build configs: NO
- Risk level: P0
- Recommendation: `cherry_pick_candidate`
- Reasoning: Most likely source of visible missing frontend/design work, but it is broad and includes AI/admin/API/migration-sensitive paths. Do not full-merge. Extract frontend/design slices only after API compatibility and customer finance isolation review.

## design/liquid-glass-public-shell-lg2a
- Ref reviewed: `origin/design/liquid-glass-public-shell-lg2a`
- Ahead/behind: 38 ahead, 5 behind
- Last commit: `68be705a` — 2026-06-19 — `docs: add final LG branch readiness report`
- Main changed areas: frontend, backend, AI, mobile, migrations, release/ops, docs, tests
- Key files changed: public marketing pages, Liquid Glass components, public header/footer, AI flywheel services, AI migrations, iOS feedback files
- Key commits: `68be705a`, `609bbd62`, `e38d07c1`, `d5350cfc`, `51a06788`, `94eb5ded`, `387c7650`, `1e4c210b`, `108c7941`, `22d3d155`
- Appears stale: NO
- Overlaps with newer work: YES with `release/web-pilot-rc` and AI branches.
- Contains migrations: YES
- Touches auth/tenant/security: YES
- Touches production deploy config: NO
- Touches mobile build configs: NO
- Risk level: P0
- Recommendation: `manual_compare_required`
- Reasoning: The branch name says public shell, but the diff includes AI flywheel and migrations. Treat as a source branch for selected Liquid Glass frontend assets, not a full-merge candidate.

## feature/unified-product-design-certification
- Ref reviewed: `feature/unified-product-design-certification`
- Ahead/behind: 50 ahead, 5 behind
- Last commit: `38e0d705` — 2026-06-20 — `docs: add RBAC architecture audit`
- Main changed areas: frontend, backend, AI, mobile, migrations, release/ops, docs, tests
- Key files changed: Android Manager/Worker UI, iOS Manager/Worker UI, web Liquid Glass surfaces, AI admin/API surfaces, docs and certification reports
- Key commits: `38e0d705`, `1338605b`, `dd939c69`, `c7253b64`, `a35d6eb9`, `26072518`, `32fa1040`, `6dfc8a4a`
- Appears stale: NO
- Overlaps with newer work: YES with `release/web-pilot-rc`, `release/mobile-pilot-rc`, and AI branches.
- Contains migrations: YES
- Touches auth/tenant/security: YES
- Touches production deploy config: NO
- Touches mobile build configs: YES
- Risk level: P0
- Recommendation: `manual_compare_required`
- Reasoning: Too broad for direct integration. It may be a combined certification branch containing web, mobile, AI, RBAC docs, and design work. Use only as evidence/source for selected frontend/mobile design commits after comparing against narrower release branches.

## release/mobile-pilot-rc
- Ref reviewed: `release/mobile-pilot-rc`
- Ahead/behind: 12 ahead, 0 behind
- Last commit: `4da00942` — 2026-06-20 — `android: wire release signing and build RC versionCode 2 AABs`
- Main changed areas: frontend, backend, AI, mobile, release/ops, docs, tests
- Key files changed: Android Manager/Worker Gradle and UI, iOS app icons/orientation, mobile LG redesign, web/mobile docs, API-adjacent files
- Key commits: `4da00942`, `442dbf10`, `3cc92efe`, `08718252`, `d574f1f1`, `31c17242`, `3617c0cd`, `6e18e84e`
- Appears stale: NO
- Overlaps with newer work: YES with `feature/unified-product-design-certification`.
- Contains migrations: NO
- Touches auth/tenant/security: YES
- Touches production deploy config: NO
- Touches mobile build configs: YES
- Risk level: P0
- Recommendation: `manual_compare_required`
- Reasoning: Mobile work is real and recent, but includes signing/build config and cross-module changes. Integrate later as a separate mobile group after backend/API and web surfaces are stabilized.

## chore/phase13-operator-refresh
- Ref reviewed: `chore/phase13-operator-refresh`
- Ahead/behind: 1 ahead, 18 behind
- Last commit: `72ef0222` — 2026-06-17 — `chore: operator tooling, legacy API inventory, doc refresh`
- Main changed areas: frontend, backend, mobile, release/ops, docs
- Key files changed: `apps/web/app/api/tenant/members/route.ts`, `docs/audit/LEGACY_API_SURFACE_INVENTORY.md`, `docs/ops/POST_MERGE_GOVERNANCE_CHECKLIST.md`, `ios/README.md`, smoke/verify scripts
- Key commits: `72ef0222`
- Appears stale: NO
- Overlaps with newer work: YES, all 8 changed files have main-side drift since merge base.
- Contains migrations: NO
- Touches auth/tenant/security: YES
- Touches production deploy config: NO
- Touches mobile build configs: NO
- Risk level: P0
- Recommendation: `manual_compare_required`
- Reasoning: Contains useful operator/docs/smoke material, but touches tenant API behavior. Split docs/scripts from API change and review tenant route separately.

## cursor-test
- Ref reviewed: `origin/cursor-test`
- Ahead/behind: 0 ahead, 490 behind
- Last commit: `3d88f1ba` — 2026-03-15 — `fix(vercel): update install command to include dev dependencies for Vercel build`
- Main changed areas: none relative to main
- Key files changed: none
- Key commits: none ahead of main
- Appears stale: YES
- Overlaps with newer work: NO
- Contains migrations: NO
- Touches auth/tenant/security: NO
- Touches production deploy config: NO
- Touches mobile build configs: NO
- Risk level: P3
- Recommendation: `ignore_archive`
- Reasoning: This branch has no commits ahead of main and is very stale. Do not integrate.
