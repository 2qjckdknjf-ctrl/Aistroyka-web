# Deep Audit Risk Register

Date: 2026-05-25  
Scale: `Critical / High / Medium`  
Status terms: `open`, `in_progress`, `blocked`, `closed`

## Critical

| ID | Risk | Evidence | Impact | Owner | Status |
|---|---|---|---|---|---|
| C-01 | Stakeholder can access internal estimate intelligence via `/api/v1/projects/:id/estimate` | `estimate/route.ts` 403 for stakeholder; `route.test.ts`; prod stakeholder sanity `27646563842` | Direct violation of customer-finance isolation rule from roadmap | Web + DB | closed (route guard + CI blocking stakeholder sanity; migration evidence in `20260329140000_stakeholder_rls_isolation.sql`) |
| C-02 | Production deploy not promotion-gated by staging success | `.github/workflows/deploy-cloudflare-staging.yml`, `.github/workflows/deploy-cloudflare-prod.yml` | Defective change can reach production without mandatory staged pass | Release Eng | closed (staging success `26402956304` promoted into production `workflow_run` `26403104100`; latest full production pass `26406727533`) |
| C-03 | Required merge checks/branch protection not provably enforced from repo state | `scripts/ops/configure-main-branch-protection.sh`; API `branches/main/protection` (2026-06-16) — required `check`, 1 PR review | CI bypass risk if ruleset misconfigured | Repo Admin | closed (classic protection applied 2026-06-16; required status check `check`, 1 approving review) |
| C-04 | Supabase migration readiness was outside automated deploy contour | `scripts/release/check-env-config.sh` (`migrations` mode), deploy workflows | Schema drift risk between application deploy and DB state | Release Eng + DB | closed (staging `26411584976` and production `26411702450` executed `Check env/config (migrations)` successfully after secrets rollout) |

## High

| ID | Risk | Evidence | Impact | Owner | Status |
|---|---|---|---|---|---|
| H-01 | Finance fail-closed guard is not uniformly applied across customer routes | `apps/web/lib/security/customer-finance-guard.ts`; route-level usage now expanded across portal endpoints + regression tests | Regression can leak finance fields without hard fail | Web | closed (blocking stakeholder finance sanity passed in production `26411702450`; portal denylist + `/costs`/`/estimate` denies verified) |
| H-02 | E2E and AI post-deploy checks are non-blocking in deploy flows | `continue-on-error: true` in staging/prod workflows | Release can pass with unresolved customer-flow or AI regressions | Release Eng | closed (staging pilot E2E is blocking and verified in `26402956304`; AI Phase 5 gate intentionally remains non-blocking by policy) |
| H-03 | Webhook security can run unsigned if secret not configured | `apps/web/lib/webhooks/webhook-verifier.ts`, `apps/web/app/api/v1/webhooks/incoming/route.ts`, `apps/web/app/api/webhooks/incoming/route.ts` | Event injection risk under misconfiguration | Platform | closed (live probe confirmed fail-closed behavior in production: unsigned `POST /api/v1/webhooks/incoming` returns `503` with explicit configuration error) |
| H-04 | Cron/job triggers are weak if `REQUIRE_CRON_SECRET` disabled | `apps/web/lib/api/cron-auth.ts` | Unauthorized job triggering / abuse risk | Platform | closed (GitHub `CRON_SECRET` configured; production run `26406727533` passed fail-fast gate + blocking pilot smoke/stakeholder sanity) |
| H-05 | Legacy API surface coexists with canonical `/api/v1` | `docs/audit/LEGACY_API_SURFACE_INVENTORY.md`; tenant/members redirect 2026-06-16 | Drift and inconsistent auth/validation behavior | Web | in_progress (inventory + redirect expansion; dashboard `/api/projects` migration pending) |
| H-06 | RLS advisory backlog (11 tables) unresolved in repo migrations | reported in phase docs, no closure migration committed | Security due-diligence and enterprise readiness risk | DB | open (estimate-results RLS hotfix prepared; remaining table set pending) |

## Medium

| ID | Risk | Evidence | Impact | Owner | Status |
|---|---|---|---|---|---|
| M-01 | Multi-tenant context ambiguity (first membership row selection) | `apps/web/lib/tenant/tenant.context.ts` (`limit(1)` without explicit tenant selection) | Wrong-tenant user experience or accidental data scope confusion | Web | open |
| M-02 | No single blocking E2E chain for roadmap customer flows 7-14 | `docs/audit/FINAL_E2E_REPORT.md`, `apps/web/tests/e2e` | Coverage blind spots for launch-critical customer flows | QA + Web | open |
| M-03 | OpenNext Cloudflare patch chain is fragile | deploy patch scripts + `wrangler.deploy.toml` path | Build/deploy regressions on toolchain upgrades | Platform | in_progress |
| M-04 | Phase 13 closure artifacts are partially stale/inconsistent | `docs/product/PHASE13_ROADMAP_CLOSURE.md` vs newer release docs | Governance confusion, false block/false green risk | Product/Release | closed (refreshed 2026-06-15; aligned with prod `cd130eb`, PR #76/#83, deploy runs `27528576940`/`27528720688`) |
| M-05 | Orphan workflow configs under non-canonical path can mislead operators | `apps/web/.github/workflows/README.md` documents non-canonical path | Operational confusion and wrong assumptions | Release Eng | closed (README added 2026-06-16; canonical paths in `DEPLOYMENT_SOURCE_OF_TRUTH.md`) |

## Risk acceptance policy for this audit

- No `Critical` risks are acceptable for GA posture.
- `High` risks require either fix or explicit signed temporary acceptance with expiry date.
- `Medium` risks may be deferred only with owner, due date, and regression test guard.

## Exit criteria (risk-register side)

This register can be considered green only when:

1. C-01, C-02, C-03 are `closed`.
2. H-01 through H-04 are `closed` or accepted with signed expiry and compensating controls.
3. Updated evidence links are attached to each closed item (tests/workflow runs/docs).
