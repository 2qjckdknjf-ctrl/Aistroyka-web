# Wave 4 Step 5 — Validation (Stage I)

## Tests

| Area | File |
|------|------|
| Service: owner gate, portal off, shaped payload, no path leakage | `lib/domain/client-portal/client-portal.service.test.ts` |
| GET client-view route | `app/api/v1/projects/[id]/client-view/route.test.ts` |
| PATCH client-portal route | `app/api/v1/projects/[id]/client-portal/route.test.ts` |

## Build

- `npm run test` (repo root) — **passed** (190 files, 1154 tests).
- `npm run build` — **passed** (Next.js production build).

## Focused checks performed

- Service test asserts JSON of result does not contain `object_path` or `decision_comment`.
- Route tests cover 403/404/200 paths for client-view and 400/403/200 for client-portal.

## Gaps (documented)

- **P2**: No Playwright E2E for client page; optional follow-up.
- **P2**: `ClientPortalViewClient` uses hardcoded English strings — add `next-intl` keys for parity with other locales.
