# Wave 4 Step 17 — Validation

**Date:** 2026-03-28 (local run)

| Command | Result |
|---------|--------|
| `npm test` (repo root → Vitest `apps/web`) | **PASS** — 211 files, 1222 tests |
| `npm run build` | **PASS** — contracts + Next production build |

## Focused tests

- `lib/domain/recurring-operations/recurring-operations.cadence.test.ts` — cadence / dedupe helpers  
- `app/api/v1/admin/jobs/cron-tick/route.test.ts` — response includes `recurring_operations` (mocked runner)  

## Manual / follow-up

- Apply migration `20260406120000_recurring_operational_rules.sql` to hosted Supabase before production fires.  
- Smoke: POST cron-tick with `x-cron-secret` and verify `recurring_operations` counters and DB rows.  
