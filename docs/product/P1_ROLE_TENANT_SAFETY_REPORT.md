# P1 — Role / Tenant Safety Report

**Date:** 2026-07-02  
**Area:** Task F — P1 boundary verification  
**Verdict:** **PARTIAL** (existing gates hold; no new P1-specific integration tests added)

---

## Verification matrix

| Check | Result | Evidence |
|-------|--------|----------|
| Manager/admin can create/upload/review documents | ✅ PASS | `canManageProjects` in `document.service.ts`, upload route, decision routes |
| Manager can approve/reject/request-changes reports | ✅ PASS | PATCH `/api/v1/reports/[id]` + policy |
| Worker cannot approve manager-only items | ✅ PASS | Worker routes lack manage policy; report PATCH review is manager-scoped |
| Stakeholder cannot access internal approval/document internals | ✅ PASS | Portal route strips finance keys; dashboard paths gated; `portal/documents` test rejects unsafe payload |
| Cross-tenant access denied | ✅ PASS | RLS on `project_documents`; service loads by `tenant_id`; project/document 404 on mismatch |
| Unauthenticated denied | ✅ PASS | `requireTenant` → 401 on API routes |

---

## Existing test coverage (not P1-new)

| Area | Tests |
|------|-------|
| Tenant policy | `tenant.policy.test.ts` |
| Stakeholder RLS predicates | `rls-stakeholder-predicates.test.ts` |
| Stakeholder dashboard paths | `stakeholder-dashboard-paths.test.ts` |
| Portal documents safety | `portal/projects/[id]/documents/route.test.ts` |
| Report policy | `report.policy.test.ts` |
| Document policy transitions | `document.policy.test.ts` |
| Upload route auth | `upload/route.test.ts` (403 insufficient rights) |

---

## P1 touchpoints reviewed

- Document upload route: 401/403/404 paths unchanged; status gate extended only for `changes_requested`
- Pending approvals API: tenant-scoped queries only
- Report approval events: insert includes `tenant_id`
- No relaxation of stakeholder / customer finance isolation (roadmap rule preserved)

---

## Gaps

| Gap | Risk | Blocks P1? |
|-----|------|------------|
| No new dedicated test: worker → document decision 403 | Low — covered by policy pattern | NO |
| No new dedicated test: cross-tenant document upload | Low — repo tenant filter | NO |
| Owner vs manager decision authority mismatch (design) | Low for pilot — managers use PATCH | NO |

---

## Recommended follow-up (P2)

- Add route tests: worker role → document decision 403, cross-tenant document id 404
- Align owner bulk decision RPC with manager PATCH authority if product requires strict owner-only approve

---

## Closure verdict

**PARTIAL** — Boundaries verified by code review + existing suite; no regressions introduced. Missing focused P1-only tests classified as P2 hardening, not pilot blockers.
