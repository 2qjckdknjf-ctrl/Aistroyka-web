# Wave 4 Step 13 — Strict post-audit

Ratings: **FULL** | **PARTIAL** | **OPEN**

| # | Area | Rating | Notes |
|---|------|--------|--------|
| 1 | Defect scope selection | **FULL** | Construction punch list only; distinct from `project_issues`; deferrals documented. |
| 2 | Defect model | **FULL** | Persisted `project_defects` + events table; migration in repo. |
| 3 | Backend workflow | **FULL** | Service transitions, policies, API routes; stakeholder-safe GET. |
| 4 | Governance / lifecycle | **FULL** | Explicit statuses; blocking rule tied to readiness query. |
| 5 | Manager defect UX | **FULL** | Tab + list + detail workflow. |
| 6 | Stakeholder visibility | **FULL** | Portal list/detail + create; no assignee UUID leak on public detail. |
| 7 | Handover integration | **FULL** | Readiness blocker + deep link to punch tab. |
| 8 | Validation strength | **PARTIAL** | Unit/route tests added; **full `vitest` + `npm run build` not executed in agent session** — must be green in CI/local before hard closure. |

## Remaining issues

| Priority | Item |
|----------|------|
| **P1** | Confirm CI/local: `npm run build` + full relevant test suites pass. |
| **P1** | Apply Supabase migration `20260404120000_project_defects.sql` to target environments. |
| **P2** | Optional: stakeholder-created rows also get an audit event (would require policy change or service role). |
| **P2** | Optional: surface defect counts on client-view API card (currently link-only from portal home). |

## Wave 4 Step 13 closed enough for next sub-step?

**NO** — until **P1** items are satisfied (green build + migration applied in the environment of record). The implementation is materially complete; closure is blocked on **recorded** validation and schema rollout, not on missing product semantics.
