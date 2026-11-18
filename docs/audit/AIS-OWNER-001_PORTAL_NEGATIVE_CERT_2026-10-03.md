# AIS-OWNER-001 portal negative certification — 2026-10-03

Live staging/production personas for a dedicated **stakeholder** account were not present (`E2E_EMAIL` / `SMOKE_EMAIL` are contractor smoke identities). Reusing one incomplete account as multiple personas is forbidden. Live portal negatives are therefore **BLOCKED_EXTERNAL**.

## Checks

| Check | Classification | Evidence |
|---|---|---|
| Stakeholder sees only allowed projects (policy: missing active membership on other project) | PASS (unit) | `stakeholders.policy.test.ts` cross-project denial |
| Stakeholder cannot elevate membership (`canManageProjectStakeholders`) | PASS (unit) | same file — manage denied, membership lookup not called |
| Portal disabled even if stakeholder active | PASS (unit) | same file |
| Missing tenant context fails closed | PASS (unit) | same file |
| Revoked stakeholder stays revoked (DB trigger) | NOT_TESTED live | depends on PR #371 migration `block_stakeholder_self_reactivation` on staging |
| Stakeholder cannot mutate contractor-only data | NOT_TESTED live | no stakeholder bearer token |
| Cross-project access denied | PASS (unit) / NOT_TESTED live | policy unit only |
| Cross-tenant access denied | NOT_TESTED live | no second-tenant stakeholder persona |
| Project membership enumeration leak | NOT_TESTED live | needs authenticated portal user |
| Portal-only route guards fail closed | NOT_TESTED live | needs browser E2E |
| Break-glass remains explicit/audited | NOT_TESTED live | platform-admin, not portal |

## Follow-up

Provision a dedicated staging stakeholder persona (invite → accept → revoke) distinct from `E2E_EMAIL`. Then replay this matrix against `https://staging.aistroyka.ai`.
