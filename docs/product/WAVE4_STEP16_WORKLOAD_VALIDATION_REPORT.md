# Wave 4 Step 16 — Validation report

**Date:** 2026-03-28 (run in repo)

## Commands

| Command | Result |
|---------|--------|
| `npm test` (from repo root; Vitest in `apps/web`) | **PASS** — 210 files, 1219 tests |
| `npm run build` (contracts + `next build`) | **PASS** — compiled, typecheck, static generation |

## Focused workload coverage

- `lib/domain/workload/workload.governance.test.ts` — `priorityForManagerSignal` (blocking defects, budget over)
- `app/api/v1/workload/route.test.ts` — default manager, invalid audience 400, stakeholder + **leadership** dispatch

## Not covered in automated tests (manual / follow-up)

- End-to-end `buildManagerWorkload` / `buildStakeholderWorkload` / `buildLeadershipWorkload` with a real or chained Supabase mock (cost vs value).
- Playwright / browser drilldown clicks.

## API smoke (manual)

- `GET /api/v1/workload?audience=manager|stakeholder|leadership` behind auth — verify 401 without tenant session, 200 with valid session in staging.
