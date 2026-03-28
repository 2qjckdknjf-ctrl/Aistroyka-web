# Wave 3 — Mobile final report

**Date (UTC):** 2026-03-28

## Lite / mobile API surface (production)

After deploy alignment (`sha7: f941d0e`):

- Lite allow-list includes **GET** `/api/v1/tasks/:id` and **GET** `/api/v1/reports/:id` (see `apps/web/lib/api/lite-allow-list.ts`).
- Live checks used **`x-client: ios_lite`** / **`android_lite`** — no `lite_client_path_forbidden` on those paths when combined with valid auth (see rule verification doc).

## Device proof

**Not run:** Physical iOS/Android app session against prod in this environment.

## Substitute evidence

- **API truth:** same headers mobile would send (`x-client`, `Authorization`, `x-idempotency-key` on writes) — **PASS** on sampled flows.
- **Build truth:** native apps not rebuilt in this sprint.

## Manual procedure (operator)

1. Point app config to `https://www.aistroyka.ai` (or follow `Config` / `NEXT_PUBLIC_APP_URL` in mobile shared config).
2. Log in as pilot worker.
3. Confirm task detail and report detail endpoints return **404/403 as appropriate**, not **403 lite_client_path_forbidden** for allowed routes.

## Blockers

None for **API contract** verification; **device E2E** remains manual.
