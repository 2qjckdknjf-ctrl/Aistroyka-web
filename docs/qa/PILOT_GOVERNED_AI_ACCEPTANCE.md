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
| 8 | Tenant isolation | PASS_LOCAL_INTEGRATION (route + contract tests; live RLS BLOCKED_STAGING) |
| 9 | AI audit log | PASS_UNIT |
| 10 | Owner allowed data only | PASS_UNIT |
| 11 | Stakeholder no internal data | PASS_UNIT |
| 12 | AI output labeled | PASS_UNIT |
| 13 | AI provider optional | PASS_UNIT |
| 14 | Web build | PASS_CI |
| 15 | Mobile tests | PASS_UNIT (Android shared); iOS NOT_VERIFIED_LIVE |
| 16 | Additive migrations | PASS_LOCAL_INTEGRATION |
| 17 | Docs match code | PASS_UNIT |
| 18 | No new P0 security issues | PASS_UNIT (review) |
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

All steps in `STAGING_MIGRATION_APPLY_MANIFEST_PILOT_GOVERNED_AI_2026-08-24.md` — **NOT_VERIFIED_LIVE**
