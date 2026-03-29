# Wave 4 Step 7 — Rollout post-audit (strict)

**Date:** 2026-03-29

## Items (FULL / PARTIAL / OPEN)

| # | Item | Status | Notes |
|---|------|--------|------|
| 1 | Rollout path truth | **FULL** | Documented from `.github/workflows/apply-migrations.yml`, `scripts/release/*`, `docs/closure/A1_*` |
| 2 | Staging apply | **OPEN** | **Not proven** — `db push` dry-run failed; apply not run |
| 3 | Staging verification | **OPEN** | Not run (no apply) |
| 4 | Production apply | **OPEN** | Not run |
| 5 | Production verification | **OPEN** | Not run |
| 6 | Legacy remediation proof | **OPEN** | SQL not executed on target DBs in this sprint |
| 7 | Stakeholder data-plane isolation confidence (live) | **OPEN** | Migrations not applied — model not **live** in verified environments |
| 8 | Validation strength | **PARTIAL** | Real CLI evidence for **blockers**; no post-apply SQL |

## Remaining issues

| Severity | Issue |
|----------|--------|
| **P0** | **Migration history drift:** linked remote records `20260325063743`, `20260325142157` **not** in `apps/web/supabase/migrations/` — blocks `supabase db push` until resolved with official repair/pull process and team sign-off. |
| **P1** | **Date gate:** `scripts/release/check-migrations.sh` rejects `20260330*` files when run on **2026-03-29** UTC — **blocks GitHub workflow** preflight until **2026-03-30** UTC or policy adjustment. |
| **P2** | Linked **local** project ref not confirmed as **staging**; GitHub Environments remain authoritative for named targets. |

## Rollout-complete decision

**Is Step 7 repo-closed **and** rollout-complete in target environments: NO**

**Hard rules:** Staging and production apply are **not** proven; legacy remediation and live RLS are **not** proven on targets.

## Next operator actions (ordered)

1. **Resolve P0 drift:** Compare remote `schema_migrations` / `supabase migration list` for **staging** project with `main`/`develop` branch; add missing migration files to repo **or** use documented `supabase migration repair` **only** after verifying actual schema state (see runbook).  
2. **Wait or adjust P1:** Run workflow on/after **2026-03-30** UTC **or** rename migrations with team governance (if not yet applied anywhere).  
3. **GitHub workflow_dispatch:** Apply to **staging** first; capture logs; then **production** with Environment approval.  
4. **Run verification SQL** from `WAVE4_STEP7_STAGING_VERIFICATION_REPORT.md` / legacy report after apply.
