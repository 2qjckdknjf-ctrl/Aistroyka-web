# V2-WEB-01 — Create Task registration loop — 2026-11-19

**Status:** FIXED (source + jsdom regression)  
**Scope:** Canon tasks create CTA registration (`DashboardTasksCanonPage` ↔ `DashboardTasksClient`)  
**Not claimed:** authenticated staging browser AC-02/AC-03 visual PASS

## Repro (source)

Oct-19 audit: inline `onRegisterCreateHandler={(open) => setOpenCreate(() => open)}` + child `useEffect(..., [onRegisterCreateHandler])` → effect↔setState loop / Maximum update depth.

## Fix

1. Parent: stable `useCallback` register handler.  
2. Child: stable `openCreateForm` via `useCallback` + register through a ref so parent identity churn cannot re-enter the effect.

## Evidence

- `components/canon/create-task-register.behavior.test.ts` — settles ≤4 parent renders for stable and unstable-parent cases.  
- Route coverage added in the same PR: `help/query`, `billing/checkout-readiness`, `platform/audit`, `platform/leads`, `admin/operator/context`.

## Remaining

- V2-WEB-01-TEST-02 (authenticated staging create/cancel) — needs session fixtures.  
- V2-WEB-02+ remain open per mega-plan DAG.
