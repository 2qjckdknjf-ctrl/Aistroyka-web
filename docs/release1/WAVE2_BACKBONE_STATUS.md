# Wave 2 — Backbone status (R1 operational spine)

## Projects

- **List / create:** `GET/POST /api/v1/projects` → `app/api/projects/route.ts` uses `createClientFromRequest` + `listProjects` / `createProject`.
- **Detail:** `GET /api/v1/projects/:id` uses `getProject` with Bearer-safe client.
- **Scoped lists:** `GET .../projects/:id/reports` and `GET .../projects/:id/uploads` now use **`createClientFromRequest`** (Wave 2 fix) so tenant RLS matches JWT for all clients.

**Tenant/role:** Project access enforced via domain services + `getTenantContextFromRequest`; no change to policy rules this wave.

## Tasks

- **`/api/v1/tasks`**, **`/api/v1/tasks/:id`**, **`/api/v1/tasks/:id/assign`** already used `createClientFromRequest` — **no code change**; backbone considered aligned.

## Reports

- **List/detail/review:** `api/v1/reports`, `api/v1/reports/:id` (GET/PATCH), approval-history — already Bearer-safe.
- **Analysis status:** `GET /api/v1/reports/:id/analysis-status` now uses **`createClientFromRequest`** for the user-scoped Supabase leg (admin client still used for job listing when configured).

## Review

- **PATCH `/api/v1/reports/:id`:** `canReviewReport` (manager/admin via `canManageProjects`), statuses `approved` | `rejected` | `changes_requested`, audit emit — **unchanged**; already consistent.

## Later-wave dependencies

- **Wave 3:** Worker mobile proof chains (G4) consuming worker/report/media APIs.
- **Wave 4:** Manager mobile placeholders / parity.
- **Wave 5+:** Client visibility, earnings light, notifications depth.

## Green for R1 backbone?

**Yes** for **API correctness** on the adjusted paths and **already-correct** task/report routes: Bearer and cookies both drive the same RLS user for tenant-scoped queries. Full **operational** “green” for Release 1 DoD still requires later waves (mobile, G4–G6).
