# Wave 3 — Cross-worker validation report

**Date (UTC):** 2026-03-28

## Code changed

**YES** — minimal runtime fix (see commit `6a808bd` on `main`):

- `apps/web/lib/tenant/client-profile.ts` — `isLiteWorkerClient`
- `apps/web/app/api/v1/reports/[id]/route.ts` — lite peer isolation on GET
- `apps/web/app/api/v1/tasks/[id]/route.ts` — lite uses worker path only (no manager-wide task view)

## Tests

| Suite | Result |
|-------|--------|
| `lib/tenant/client-profile.test.ts` | Pass |
| `npm run build` (repo root) | Pass |

## Focused checks

- Production health aligned to **`6a808bd`**
- Live curls: A → **404**, B → **200** on same report id with **`x-client: ios_lite`**

## Regression

- **Web / manager** clients (`web`, `ios_manager`, etc.) still use existing `canReviewReport` / `canManageTasks` branches — unchanged for non-lite.
