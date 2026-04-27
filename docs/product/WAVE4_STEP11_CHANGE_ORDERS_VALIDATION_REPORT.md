# Wave 4 Step 11 — Validation report (Stage H)

## Tests

- **Unit:** `lib/domain/change-orders/change-orders.service.test.ts` — list excludes draft for stakeholders; draft detail hidden; invalid transition rejected; locked record blocks content edit.
- **Full suite:** `apps/web` `npm test` — **200 files, 1186 tests passed** (at validation time).

## Build

- Repo root `npm run build` — **succeeded**.

## Deployment

- Apply migration `20260402120000_project_change_orders.sql` in each Supabase environment before relying on production behavior.

## Gaps

- No dedicated HTTP `route.test.ts` for change-order endpoints (service tests cover policy and transitions).
