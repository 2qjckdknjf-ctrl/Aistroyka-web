# Pilot Governed AI — Acceptance Checklist (updated 2026-08-24)

**PR:** https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/244

Status legend: `PASS_UNIT` | `PASS_LOCAL_INTEGRATION` | `PASS_CI` | `BLOCKED_STAGING` | `NOT_VERIFIED_LIVE`

## Acceptance gates

| # | Gate | Status |
|---|------|--------|
| 1 | Report flow not broken | PASS_UNIT |
| 2 | Evidence chain on APIs | PASS_UNIT |
| 3 | Server completeness | PASS_UNIT |
| 4 | AI policy classification | PASS_UNIT |
| 5 | Prohibited actions blocked | PASS_UNIT |
| 6 | Consequential → approval | PASS_UNIT |
| 7 | RBAC server-side | PASS_UNIT |
| 8 | Tenant isolation | PASS_LOCAL_INTEGRATION; live RLS **BLOCKED_STAGING** until `20260824150000` applied |
| 9 | AI audit log | PASS_UNIT + service-role write enforcement |
| 10 | Owner allowed data only | PASS_UNIT |
| 11 | Stakeholder no internal data | PASS_UNIT |
| 12 | AI output labeled | PASS_UNIT |
| 13 | AI provider optional | PASS_UNIT |
| 14 | Web build | PASS_CI |
| 15 | Mobile tests | PASS_UNIT (Android shared); iOS NOT_VERIFIED_LIVE |
| 16 | Additive migrations | PASS_LOCAL_INTEGRATION (4-file slice; Docker replay NOT_TESTED) |
| 17 | Docs match code | PASS_UNIT |
| 18 | No new P0 security issues | PASS_UNIT; live advisor NOT_TESTED |
| 19 | No placeholder success | PASS_UNIT |
| 20 | PR verification report | PASS_UNIT |

## Owner visibility tests

| Scenario | Status |
|----------|--------|
| Approved report → eligible evidence visible | PASS_UNIT |
| Unapproved → invisible | PASS_UNIT |
| Rejected → hidden | PASS_UNIT |
| Internal evidence → invisible | PASS_UNIT |
| Idempotent re-approval | PASS_UNIT |

## Signed media tests

| Scenario | Status |
|----------|--------|
| Not owner_visible → no URL | PASS_UNIT |
| Cross-tenant signing blocked | PASS_UNIT |
| No object_path in portal JSON | PASS_UNIT |
| UI handles unavailable image | PASS_UNIT |

## Staging smoke

| Step | Status |
|------|--------|
| Migration forward-fix `20260824150000` | **BLOCKED** — `supabase db push` aborted (pre-existing remote drift) |
| Authenticated 18-step E2E | **BLOCKED_EXTERNAL** — no `PILOT_E2E_*` in operator env |
| Script prepared | `scripts/pilot/governed-ai-owner-evidence-staging-e2e.mjs` |

**Verdict:** `PARTIAL` — not `READY_FOR_REVIEW` until staging forward-fix + authenticated E2E proven.
