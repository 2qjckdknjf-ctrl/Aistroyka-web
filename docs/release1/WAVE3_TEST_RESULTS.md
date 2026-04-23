# Wave 3 — Test results

## Commands run

```bash
. "$HOME/.nvm/nvm.sh"   # or equivalent: ensure `node` / `npx` on PATH
cd apps/web
npx vitest run lib/domain/reports/report.service.task-link.test.ts lib/domain/tasks/task.service.test.ts
npx vitest run
```

## Targeted tests

- `lib/domain/reports/report.service.task-link.test.ts` — includes new **`proof_required`** case.
- `lib/domain/tasks/task.service.test.ts` — includes **`getTaskForWorker`** cases.

## Full suite

- **Vitest (apps/web):** `182` files, **`1116`** tests — **all passed** (run 2026-03-28).

## Smoke / e2e

- `scripts/smoke/pilot_launch.sh` — **not run** in this session (requires reachable `BASE_URL` and optional `AUTH_HEADER` / Supabase smoke credentials). **Recommended** on a deployed or local server after deploy.

## Failures

- None in Vitest full run after Wave 3 changes.

## Fixes applied

- N/A (first run green).

## Remaining non-critical gaps

- End-to-end **G4** reference proof (create → upload → finalize → attach → submit → read-back) remains an **environment exercise**; server now rejects submit without media regardless of client bypass flags.
- iOS/Android **UI** does not yet call `WorkerAPI.task` / `WorkerApi.task` on every screen (optional refresh); list + local navigation remain valid for R1 minimum.
