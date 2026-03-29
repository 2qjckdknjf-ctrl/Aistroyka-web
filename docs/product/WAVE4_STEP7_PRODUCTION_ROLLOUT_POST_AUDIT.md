# Wave 4 Step 7 — Production rollout post-audit (strict)

**Date:** 2026-03-29

## Items

| # | Item | Status |
|---|------|--------|
| 1 | Git truth / pushed rollout state | **FULL** — `fc710fe6` on `origin/main` |
| 2 | Production path truth | **FULL** — workflow + CLI; AISTROYKA vs HiProject documented |
| 3 | Production preflight | **FULL** (AISTROYKA); **OPEN** (HiProject paused) |
| 4 | Production dry-run | **FULL** — after transient auth recovery |
| 5 | Production apply | **FULL** — exit 0; up to date (no new DDL) |
| 6 | Production verification | **PARTIAL** — migration list proof **FULL**; dashboard SQL / portal smoke **PARTIAL** |
| 7 | Legacy remediation proof | **PARTIAL** — migration contains update; **live row count not run** |
| 8 | Data-plane isolation confidence | **PARTIAL** in production — policies applied via migration history; **not** re-proven with SQL in this session |
| 9 | Validation strength | **PARTIAL** — sanity script + focused test only |

## Issues

| Severity | Issue |
|----------|--------|
| **P2** | **HiProject** paused — not validated; unclear if ever a prod target. |
| **P2** | Dashboard SQL verification **not** run. |
| **P2** | First **dry-run** attempt hit pooler auth/circuit breaker — **resolved** on retry; monitor for flaky CLI auth. |

## Verdicts (hard rules)

| Question | Answer |
|----------|--------|
| Repo fixes committed and pushed? | **YES** |
| Production migration list + dry-run + apply **proven** for **AISTROYKA**? | **YES** |
| Legacy remediation **proven** with live SQL count? | **NO** → **PARTIAL** |
| Data-plane isolation **fully** reproven in prod with SQL? | **NO** → **PARTIAL** |
| Step 7 rollout complete in **AISTROYKA** production DB? | **YES** (migrations applied; CLI confirms up to date) |
| Step 7 fully rollout-complete **across all org Supabase projects**? | **NO** (HiProject unknown/paused) |

**Overall strict closure:** **PARTIAL** — **AISTROYKA** production is aligned; **live** remediation/policy SQL and **second** project remain gaps.
