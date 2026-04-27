# Wave 1 — Final status

## Delivered

- **Bearer/cookie parity** on tenant-scoped routes that previously mixed `getTenantContextFromRequest` (Bearer-aware) with `createClient()` (cookie-only) for database access: worker summary/days, project workers list, sync bootstrap/changes/ack.
- **Regression safety:** sync route tests updated; full Vitest + pilot smoke **green**.

## Critical defects addressed (Wave 1 scope)

- **PHASE1_FINAL_SCOPE §F** called out `workers/[userId]/summary` using `createClient()` — verified and **fixed** to use `createClientFromRequest(request)`.
- **Mobile/sync contour:** same bug class on sync endpoints would break or weaken RLS for Bearer-only clients — **fixed** without touching upload-session internals or webhook code.

## Auth / tenant / role foundation

- **Stable:** `getTenantContextFromRequest` and `createClientFromRequest` behavior unchanged; routes now **consistent** with them for Supabase queries.
- **Login / middleware:** not modified.
- **Team / invite / membership:** not regressed (no edits to those routes in this wave).

## What remains for Wave 2

Per `PHASE1_EXECUTION_WAVES.md`: **project / task / report / review backbone verification** (F2–F5), contracts alignment, remaining `createClient()` audit on other v1 routes if gate-backed.

## Verdict

**WAVE1_COMPLETE**

No blocker identified for Wave 1 scope; do **not** start Wave 2 implementation in this document set.
