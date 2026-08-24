# AISTROYKA — Current Truth Snapshot

**Generated:** 2026-08-21 (Europe/Madrid)  
**Purpose:** Single-page authoritative state for launch readiness execution  
**Supersedes:** Stale pointers in `STATUS.md` / truth index dated before PR #223–#227 merge

---

## Classification

`production-capable / controlled-pilot candidate` — **not Public GA**

## Source & runtime SHAs

| Layer | SHA | Evidence |
|-------|-----|----------|
| **origin/main** | `a7144249ed0cf1f049cfbdaa9e36e722b1bcfcc8` (`a714424`) | `git rev-parse origin/main` @ 2026-08-21 |
| **Production** (apex/www) | `a714424` | `GET https://aistroyka.ai/api/v1/health` → `buildStamp.sha7=a714424`, `buildTime=2026-08-21 00:44` |
| **Staging** | `a714424` | `GET https://staging.aistroyka.ai/api/v1/health` → `buildStamp.sha7=a714424`, `buildTime=2026-08-21 00:40` |
| **Runtime ↔ source** | **MATCH** | Prod/staging = `origin/main` tip |

## Deployment platform

| Environment | Owner | Notes |
|-------------|-------|-------|
| Production | Cloudflare Workers (OpenNext) | `apps/web/wrangler.toml`; CI: `deploy-cloudflare-prod.yml` |
| Staging | Cloudflare Workers (OpenNext) | `deploy-cloudflare-staging.yml` on merge to `main` |
| Preview | Vercel (secondary) | Not canonical for prod/staging truth — see `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md` |

## Database

| Field | Value |
|-------|-------|
| Active project | AISTROYKA (`vthfrxehrursfloevnlp`, eu-central-1) |
| Health | `db=ok`, `supabaseReachable=true` (prod health @ 2026-08-21) |
| Repo migrations | 154 files under `apps/web/supabase/migrations/` |
| Remote-only drift | **DETECTED** — `20260821215505_021_saved_places`, `20260821215559_022_protected_day_events` on remote, **not in repo** (Phase 3 gate) |
| Repo-only (not yet on remote tail) | Last repo file: `20260807090000_jobs_payload_project_tenant_check` — reconcile in Phase 3 |

## GitHub governance

| Control | State |
|---------|-------|
| Branch protection `main` | `enforce_admins=true`; 1 required approving review |
| Required status checks (API) | Not enabled on branch protection endpoint (404) — CI enforced via PR practice + `ci-check.yml` |
| Rulesets | None |
| Open PRs | 30 (mostly `cursor/critical-bug-investigation-*` security fixes; design remediation #221) |
| Open issues (launch-relevant) | #158 iOS distribution, #159 Android distribution, #160 mobile pilot decision, #111 AI/Flywheel (deferred post-baseline) |

## Recent merges on main (post design audit)

| PR | Title | Merge SHA |
|----|-------|-----------|
| #227 | Post-unify audit — AI Copilot + chrome bugs | `a7144249` |
| #226 | Unify web + iOS + Android to Memory OS canon v4 | `5d89ee0d` |
| #225 | iOS WorkerSemanticColors compile fix | `d845cd2f` |
| #224 | Canon audit remediation web + iOS + Android | `2ebfb2cf` |
| #223 | Canonical Liquid Glass redesign slices 01–24 | `00c0c307` |

## Mobile

| Surface | State |
|---------|-------|
| iOS Manager + Worker | Present; primary pilot contour; store upload = `OWNER_ACTION_REQUIRED` |
| Android Manager + Worker | Present (Compose scaffolds); deferred for first pilot per policy |
| TestFlight / Play | Not certified at this execution start |

## AI

| Claim | State |
|-------|-------|
| Configured | `aiConfigured=true`, `openaiConfigured=true` (health) |
| LIVE certified | **NOT TESTED** in this execution — Phase 7 gate (`scripts/smoke/ai_live_provider.sh --require-live`) |

## Canonical roadmap

`docs/roadmaps/AISTROYKA_100_PERCENT_READINESS_2026-08-21.md`

## Document classification (summary)

| Doc / area | Classification |
|------------|----------------|
| This file + master roadmap + execution log | **CURRENT** |
| `docs/CURRENT_PROJECT_TRUTH_INDEX.md` | **CURRENT** (updated 2026-08-21) |
| `STATUS.md` | **CURRENT** (updated 2026-08-21) |
| `docs/roadmap/AISTROYKA_100_PERCENT_COMPLETION_PLAN.md` | **HISTORICAL structure** — phase map reference only |
| `docs/reconciliation/release-truth-2026-08-02/` | **HISTORICAL** |
| `docs/roadmap/AISTROYKA_PHASE8_*` | **HISTORICAL** |
| `docs/audit/product-design-current-main-2026-08-09/` | **HISTORICAL evidence** — pre-#223 redesign |
| `docs/audit/mobile-store-readiness-2026-08-21/` | **CURRENT audit pack** (verify against `a714424`) |

## Intentionally deferred

Gold Memory, Expert Review Queue, AI Flywheel, SCIM, ERP expansion, full redesign — see master roadmap §3.

---

*Next refresh: end of Phase 0 closure or on any deploy/merge that changes runtime SHA.*
