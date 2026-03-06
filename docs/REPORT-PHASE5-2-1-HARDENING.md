# Phase 5.2.1 — Cockpit Hardening (P0/P1)

**Date:** 2025-03-06  
**Scope:** apps/web — correctness, security, reliability. No new features.

---

## Baseline (Stage 0)

| Gate | Result |
|------|--------|
| `npm test -- --run` | pass (66 files, 312 tests) |
| `npm run cf:build` | pass |

---

## P0 / P1 Fixes

### P0-A) Devices: no raw push tokens
- **Fixed:** GET `/api/v1/devices` (manager) never returns `token`, `fcm_token`, `apns_token`, or `push_token`. Response is built from explicit safe fields; any token-like key is stripped.
- **Verify:** Call `GET /api/v1/devices` as a manager (tenant context). Response `data[].*` must not contain any of the above keys. Unit test: `app/api/v1/devices/route.test.ts`.

### P0-B) Filter honesty (q + status)
- **Fixed:** Reports: server-side `q` (id/user_id/project_id prefix or contains). AI requests: server-side `q` (id/entity). Devices: server-side `q` (device_id/user_id). Uploads: status + stuck (see P0-C). FilterBar only shows filters that work; devices keep search off in UI but API supports `q`.
- **Verify:** Reports: `GET /api/v1/reports?q=rpt-a` returns only matching rows. AI: `GET /api/v1/ai/requests?q=req-` filters by id/entity. Devices: `GET /api/v1/devices?q=dev` filters. Unit tests: `lib/domain/reports/report-list.repository.test.ts`, route tests where applicable.

### P0-C) Uploads: stuck filter unification
- **Contract:** `stuck=1` = status IN (`created`,`uploaded`) AND `created_at` older than threshold. Default threshold 4h; optional `stuck_hours` (1–168).
- **Fixed:** `GET /api/v1/media/upload-sessions?stuck=1` and optional `stuck_hours=4`. UI uses `stuck=1` only (not `status=stuck`); label "Stuck >4h (created/uploaded, ≥4h old)". CSV export uses current filter (same API response).
- **Verify:** `GET /api/v1/media/upload-sessions?stuck=1` returns only created/uploaded sessions older than 4h. `?stuck=1&stuck_hours=2` uses 2h. Unit tests: `lib/domain/upload-session/upload-session.repository.test.ts`, `app/api/v1/media/upload-sessions/route.test.ts`.

### P1-D) Pagination consistency
- **Fixed:** Shared helper `parseTablePagination(params)` in `lib/cockpit/useTablePagination.ts` returns `{ page, pageSize, offset, limit }` (page 1-based, pageSize clamped 10–100). All cockpit tables (reports, uploads, devices, AI, projects) use it. Filter changes already reset page to 1 via `useFilterParams.setParam`.
- **Verify:** Change status/q/project on any list page; URL `page` resets to 1. Unit test: `lib/cockpit/useTablePagination.test.ts`.

### P1-E) E2E smoke tests
- **Added:** `tests/e2e/cockpit-smoke.spec.ts`: (1) dashboard → uploads, table or empty; (2) devices page renders or redirect; (3) AI list → open first item if exists or empty state.
- **Run:** `npm run test:e2e` or `npm run e2e`. Optional in CI; requires app running (or Playwright starts dev server when not in CI).

---

## Manual verification

- **Devices (no token):** Log in as manager → Dashboard → Devices. Open network tab; inspect `/api/v1/devices` response — no `token` (or similar) in items.
- **Reports q:** Dashboard → Daily reports → type in search (e.g. report id prefix). List updates from server.
- **Uploads stuck:** Dashboard → Uploads → Status dropdown "Stuck >4h (created/uploaded, ≥4h old)". URL should have `status=stuck` (FilterBar) and request sends `stuck=1`. Only old created/uploaded sessions appear.
- **Pagination:** On Reports/Uploads/Devices/AI, change project or status; URL must get `page=1`.

---

## Running smoke tests

```bash
cd apps/web
npm run test:e2e
# or
npm run e2e
```

Without `CI`, Playwright starts `npm run dev` and runs tests. With `CI`, set `PLAYWRIGHT_BASE_URL` or run against a deployed URL. Cockpit smoke: `tests/e2e/cockpit-smoke.spec.ts`.
