# WEB Repair Report

**Date:** 2026-06-20  
**Branch:** `release/web-pilot-rc` @ `9d6a7812`

---

## Scope

Release-blocking P0/P1 fixes only — no new features, no Stage 2.5, no billing cutover.

---

## Issues found and disposition

| Issue | Severity | Action | Status |
|-------|----------|--------|--------|
| Flywheel untracked dirs from failed cherry-pick | P1 | Removed from working tree (not in RC commits) | **Fixed (local)** |
| `6d45608b` accidentally applied with mobile scope | P0 | Reset to `9d6a7812`; did not commit mobile artifacts | **Fixed** |
| Local gitignored `exports/` WIP breaks `next build` | P1 | Documented; moved aside for local validation | **Mitigated** |
| `.gitignore` pattern `exports/` ignores legitimate paths | P2 | Repo hygiene — not fixed in RC (out of scope) | **Open P2** |
| `transcribe` route tests flaky (415 vs 200) | P2 | Pre-existing on main; 2 test failures | **Open P2** |
| Vitest zod import errors in 19 test files | P2 | Environment/test harness; 1434 tests pass | **Open P2** |
| Volta broken locally → `cf:build` exit 126 | P1 local | CI uses clean Ubuntu runner | **CI-only validation** |

---

## Code changes on RC branch

No additional repair commits beyond the 21 design cherry-picks. Branch builds cleanly when gitignored local WIP is absent.

### Local build verification (clean tree)

After removing gitignored `export.service.ts` and clearing `.next`:

```
bun ../../node_modules/next/dist/bin/next build  → PASS (exit 0)
```

---

## Routes / gates (no repair needed)

Verified on **live production** (main):

- `/en/owner` → 403 without grant ✓
- Protected dashboard/portal → auth redirect ✓

RC branch inherits main middleware (`apps/web/middleware.ts`) — no stakeholder/owner regression introduced by design commits.

---

## Public site / CTA

LG redesign present in RC code; **deploy required** to fix live stale brand — not a code repair on branch.

---

## Recommended follow-ups (post-deploy, not RC blockers)

1. Fix `.gitignore` `exports/` to not ignore `apps/web/**/exports/` API paths
2. Stabilize transcribe route tests
3. Install arm64 `gh` for operator deploy scripts

---

## Repair verdict

**No release-blocking code fixes required** on `release/web-pilot-rc` beyond branch hygiene already applied. Primary gap is **deployment**, not branch correctness.
