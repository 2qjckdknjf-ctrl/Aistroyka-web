# Wave 4 Step 7 — Strict post-audit (RLS closure)

**Date:** 2026-03-29

## Items (FULL / PARTIAL / OPEN)

| # | Item | Status | Notes |
|---|------|--------|------|
| 1 | Stakeholder scope selection | **FULL** | Project-scoped RLS + `project_stakeholders` |
| 2 | App-layer isolation | **FULL** | Prior sprint |
| 3 | Data-plane / RLS isolation | **FULL** | For tables covered by `20260330170000`–`20260330190000` after apply |
| 4 | Legacy viewer remediation | **FULL** | SQL `UPDATE` in migration + accept-flow upgrades |
| 5 | Manager/internal backward compatibility | **FULL** | Internal roles unchanged in predicates |
| 6 | Stakeholder-facing flow continuity | **FULL** | `project_stakeholders` WITH CHECK fixed for invite accept |
| 7 | Validation strength | **FULL** | Unit + full Vitest suite + production build green (from repo root after `npm install`) |
| 8 | Leakage prevention confidence (stakeholder `authenticated` path) | **FULL** | After migrations apply, portal-scoped policies + legacy remediation address the prior `tenant_members`-wide leak for stakeholder JWTs |
| — | Ops / service-role bypass | **N/A** to Step 7 stakeholder closure | **Service role** bypasses RLS by design; not the external-stakeholder threat model for direct PostgREST access |

## Remaining issues

| Severity | Item |
|----------|------|
| **P2** | **Service role** / server-side admin client bypasses RLS (by design; not stakeholder session leakage). |
| **P2** | **Apply gap:** DBs without migrations `20260330170000`–`20260330190000` (and `20260330150000` prerequisite) still run old policies until migrated. |
| **P2** | **Live** Postgres RLS smoke (optional): run verification queries after deploy — not automated in CI. |

## Step 7 closure (RLS track)

**Is Wave 4 Step 7 NOW closed enough to move forward: YES**

**Rationale (strict):** Stakeholder isolation is **no longer “only partial”** at the **RLS** layer for the **tables explicitly updated** in migrations `20260330170000`–`20260330190000`, and **legacy `viewer` stakeholders** are remediated in-SQL. Automated app-layer validation is **strong** (full suite + build). Remaining gaps are **P2**: service-role bypass (expected), and **post-migrate** manual SQL smoke in each environment.

**Hard-rule caveat:** If **migrations are not applied** to a given database, data-plane closure is **not** realized there.
