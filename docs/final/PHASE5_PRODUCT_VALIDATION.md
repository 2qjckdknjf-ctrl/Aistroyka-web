# Phase 5 — Product completion layer (validation)

**Date:** 2026-03-23  
**Tracks:** [AISAA-13](/AISAA/issues/AISAA-13)

## 1. Automated tests (repo)

Phase 5 did **not** introduce a dedicated Vitest suite. **Indirect** coverage exists in existing packages:

| Area | Where exercised |
|------|-------------------|
| Billing routes | `apps/web/app/api/v1/billing/billing-routes.test.ts`, Stripe webhook test |
| Documents / access | `document.policy.test.ts`, project access tests (see Phase 0/4 audits) |
| Notifications | `manager-notifications.repository.test.ts` |

**Command (baseline):** from repo root, `npm run test` — last recorded full pass documented in [PHASE0_BASELINE_TRUTH_AUDIT_REPO.md](./PHASE0_BASELINE_TRUTH_AUDIT_REPO.md).

---

## 2. Manual / live matrix

| Scenario | Repo expected | Live status |
|----------|---------------|-------------|
| Manager opens project, sees summary + attention + timeline | Yes | **OPEN** — blocked on tenant/RLS health per [AISAA-11](/AISAA/issues/AISAA-11) |
| Manager approves/rejects project document | Yes | **OPEN** — same |
| Manager request-changes + note on **project** document | No (gap) | N/A until implemented |
| Owner opens `/owner` view, loads attention | Yes (if `project_members.role = owner`) | **OPEN** — migration apply + RLS |
| Owner posts document decision | Yes | **OPEN** |
| Reports approvals queue | Yes | **OPEN** — orthogonal to AISAA-11; can be tested when session available |
| Billing overview JSON | Yes | **OPEN** — needs authenticated tenant session |
| Stripe checkout redirect | If configured | **OPEN** — env + Stripe |

---

## 3. What would prove “YES” later

1. **AISAA-11 closed** with redacted migration list + `GET /api/v1/health` OK on target environment.
2. **Scripted smoke:** one tenant, one project, manager document lifecycle + owner decision + one report approval (recorded).
3. **Optional:** Stripe test-mode checkout round-trip with webhook receipt (redacted).

---

## 4. Honesty rule

Do **not** mark live rows **PROVEN** from CI-only or local-only runs when the ticket depends on production/staging parity. Use **OPEN** and point to [PHASE3_REMEDIATION.md](./PHASE3_REMEDIATION.md).
