# Wave 0.6 — Wave 1 go / no-go (binary)

**Date:** 2026-03-26 (UTC)

---

## Decision

**`WAVE1_BLOCKED`**

---

## Evidence summary

| Gate | Result |
|------|--------|
| **Web Vitest (full)** | **PASS** — 1106 tests, 179 files (`npm run test` in `apps/web`) |
| **Lite allow list** | **PASS** (included in full suite; also 13/13 standalone) |
| **Upload-session route tests** | **PASS** after mock harness fix for `createClientFromRequest` |
| **Smoke (production)** | **PARTIAL** — health, config, cron-tick **PASS**; **ops/metrics** **401** without `SMOKE_*` / `AUTH_HEADER` |
| **G9 leadership sign-off** | **Absent** |
| **G9 waivers on file** | **None** for deferred items |

---

## Passed gates (Wave 0.6)

- Host-backed **web** automated tests **green**.
- **Android release** non-bypass truth unchanged from Wave 0.5 (not re-run here).

---

## Failed / incomplete gates

| Gate | Reason |
|------|--------|
| **Full smoke** | **ops/metrics** not authenticated |
| **G9** | No leadership signature; **DEFERRED** rows lack **approved** waivers |

---

## Accepted waivers

**None** formally recorded.

---

## Remaining blockers (must close before `WAVE1_APPROVED`)

1. **Leadership** signs `WAVE06_G9_SIGNOFF.md` (or attached waiver doc) — **especially** for **text comment** and **tri-state** if those stay **DEFERRED WITH APPROVED WAIVER**.  
2. **Smoke:** run `pilot_launch.sh` with **`SMOKE_EMAIL` + `SMOKE_PASSWORD`** (or `AUTH_HEADER`) so **ops/metrics** is **200**.  
3. **Optional:** Start local `next dev` if localhost smoke is required for CI parity.

---

## Exact next step

1. Add smoke credentials to `apps/web/.env.local` (or CI secrets) **without committing**.  
2. Re-run `BASE_URL=https://www.aistroyka.ai bash scripts/smoke/pilot_launch.sh` until **PASS**.  
3. Obtain **product** signature on G9 table (or issue **written waivers** for deferred rows).  
4. Re-evaluate → set **`WAVE1_APPROVED`** in a follow-up doc.

---

## Binary rule

| State | Meaning |
|-------|---------|
| **WAVE1_APPROVED** | Not current — **blocked** |
| **WAVE1_BLOCKED** | **Current** |
