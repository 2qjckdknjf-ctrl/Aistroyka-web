# Phase 9 — Expansion readiness (honest assessment)

**Date:** 2026-03-23  
**Issue:** [AISAA-17](/AISAA/issues/AISAA-17)  
**Parent:** [AISAA-1](/AISAA/issues/AISAA-1)

---

## Board gate (formal expansion)

Phase 9 is **post-core expansion** only when **final platform closure = YES**.  
Phase 8 verdict is **NO** — see [`PHASE8_CLOSURE_POST_AUDIT.md`](./PHASE8_CLOSURE_POST_AUDIT.md) and [`PHASE8_CLOSURE_MATRIX.md`](./PHASE8_CLOSURE_MATRIX.md).

**Expansion ready (formal): NO.**

This document records **ordered prerequisites** before marketing, partner, or geographic expansion should be treated as **approved**. It is **synthesis only** (no new product scope).

---

## Ordered prerequisites

Work through these in order; later items assume earlier gates are honestly green or explicitly waived by the board.

### P0 — Production truth and database parity

1. **[AISAA-11](/AISAA/issues/AISAA-11)** — Apply pending migrations (including `20260323000000_project_members_owner_role` and `20260323110000_tenant_members_rls_break_recursion` per [`PHASE3_REMEDIATION.md`](./PHASE3_REMEDIATION.md)); attach migration-list evidence; confirm `GET /api/v1/health` returns **200** with `ok: true` for the agreed anon probe. Until this is green, **all live E2E and “production closed” claims stay OPEN** across Phases 3–8.
2. **Re-run live matrix** — After P0, execute checks in [`PHASE3_RUNTIME_VALIDATION.md`](./PHASE3_RUNTIME_VALIDATION.md) and [`PHASE3_LIVE_MATRIX.md`](./PHASE3_LIVE_MATRIX.md) and refresh any stale closure notes.

### P1 — Phase 8 matrix rows still OPEN or PARTIAL-with-live-gaps

These rows in [`PHASE8_CLOSURE_MATRIX.md`](./PHASE8_CLOSURE_MATRIX.md) are **not** expansion-safe without closure or explicit scope narrowing:

3. **Auth / tenant / middleware** — Matrix: **OPEN** (live health/RLS). Unblocks with P0 + verification.
4. **DB migrations / RLS** — Matrix: **OPEN** (prod apply + health). Same as P0.
5. **Android** — Matrix: **OPEN** (scaffold / README mismatch per Phase 6). Expansion on mobile implies either **real Android parity** or a **documented, board-accepted** narrow scope — see [`PHASE6_MOBILE_POST_AUDIT.md`](./PHASE6_MOBILE_POST_AUDIT.md).
6. **Cross-cutting gates** (matrix § Cross-cutting) — **OPEN**: green health, migration parity, Playwright/full browser E2E, paid billing E2E. Each needs an owner and evidence before “expansion ready.”

### P2 — Product and workflow completeness (prevents expansion debt)

7. **Closure Sprint A (live)** — Matrix row **OPEN**; program verdict NO per `CLOSURE_A_SUMMARY.md`. Run staging/production exercises called out in Closure A docs before treating release/contact/documents as **closed**.
8. **Phase 1D — Manager documents vs approvals hub** — [`PHASE1D_DOCUMENTS_MANAGER_WORKFLOW_CLOSURE.md`](./PHASE1D_DOCUMENTS_MANAGER_WORKFLOW_CLOSURE.md): report approvals **FULL** in code; project documents manager path **PARTIAL** (no request-changes + note on manager panel; split mental model). Resolve or accept as **known limitation** before scaling manager-heavy segments.
9. **Phase 2 — Copilot / AI governance** — [`PHASE2_COPILOT_POST_AUDIT.md`](./PHASE2_COPILOT_POST_AUDIT.md): chat schema traceability, `enqueue_copilot_summary` noop, context/memory parity **OPEN**. Expansion under AI-led positioning requires either **implementation** or **explicit “beta”** boundaries.

### P3 — Scale and ops posture (after core is honest)

10. **Construction intelligence / portfolio** — [`PHASE4_INTELLIGENCE_POST_AUDIT.md`](./PHASE4_INTELLIGENCE_POST_AUDIT.md): formal contracts, route E2E, scale posture **OPEN** once live is unblocked.
11. **Plan-fit / billing / notifications** — Phase 5 post-audit: paid commerce and env-dependent paths **OPEN**; align before expansion into paid segments.
12. **Enterprise observability** — [`PHASE7_ENTERPRISE_POST_AUDIT.md`](./PHASE7_ENTERPRISE_POST_AUDIT.md): optional SaaS wiring and IR depth **OPEN** for enterprise expansion narratives.

---

## When to revisit “expansion ready”

Re-assess only when:

- Phase 8 (or successor) rollup can honestly move **platform closure** toward **YES**, and  
- P0–P1 items above are **closed or explicitly waived** with board sign-off.

Until then: **ship core remediation and closure work; do not treat Phase 9 expansion as approved.**
