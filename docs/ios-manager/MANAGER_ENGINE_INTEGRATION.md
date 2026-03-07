# Manager Engine Integration

**Date:** 2026-03-07

---

## Endpoint mapping

| Manager feature | Backend endpoint | Status |
|-----------------|------------------|--------|
| Auth / session | Supabase Auth REST (token) | ✅ Reused AuthService |
| Projects list | GET /api/v1/projects | ✅ ManagerAPI.projects(), ProjectsListView |
| Project detail | GET /api/v1/projects/:id | 🔲 Placeholder only (ProjectDetailPlaceholderView) |
| Tasks list | GET /api/v1/tasks | ✅ ManagerAPI.tasks(); UI placeholder |
| Task detail | GET /api/v1/tasks/:id | 🔲 Not wired |
| Reports list | GET /api/v1/reports | ✅ ManagerAPI.reports(); UI placeholder |
| Report detail | GET /api/v1/reports/:id | 🔲 Not wired |
| Workers / team | GET /api/v1/workers | 🔲 Adapter not added; UI placeholder |
| Ops overview | GET /api/v1/ops/overview | 🔲 Not wired |
| Org metrics | GET /api/v1/org/metrics/overview | 🔲 Not wired |
| AI (project) | GET /api/v1/projects/:id/ai | 🔲 Not wired |
| Notifications | — | 🔲 Backend TBD |
| Create task | POST /api/v1/tasks | 🔲 Not wired |
| Assign task | POST /api/v1/tasks/:id/assign | 🔲 Not wired |

## Reused contracts

- **Auth:** AuthService (Supabase sign-in, Keychain session, getAccessToken).
- **HTTP:** APIClient (Bearer token, x-device-id, x-client: ios_lite for now).
- **DTOs from Endpoints.swift:** ConfigResponse, ProjectDTO, ProjectsResponse, TaskDTO, TasksTodayResponse (and ManagerAPI.TasksListResponse for GET /api/v1/tasks).
- **Manager-specific DTOs in ManagerAPI:** ReportListItemDTO, ReportsListResponse, TasksListResponse.

## Shared services used

- Config (BASE_URL, Supabase URL/anon key, apiBaseURL).
- DeviceContext (deviceId for x-device-id).
- KeychainHelper (session token/user id).
- NetworkMonitor (available in shared code; Manager does not use it in UI yet).
- APIError (parsing and display).

## Gaps / blockers

- **x-client:** Backend may expect `ios_manager` for manager routes; APIClient currently sends `ios_lite`. Add client profile when backend defines behavior.
- **Role gating:** ManagerSessionState.checkRole() allows all logged-in users; backend does not yet expose role via a dedicated endpoint. When GET /api/v1/me or tenant context returns role, restrict to owner/admin/member and show ManagerUnauthorizedView otherwise.
- **Workers list:** GET /api/v1/workers exists; add ManagerAPI.workers() and WorkersListResponse DTO, then wire TeamOverviewPlaceholderView.
- **Ops/org metrics:** Add ManagerAPI methods and dashboard KPIs when product is ready.
- **Report detail / task detail:** Add detail screens and GET by id when needed.

## Cross-app/system relationships

- **Web:** Same Supabase project and API base; same tenant/project/task/report domain. Manager iOS and web dashboard use same GET /api/v1/* routes (with tenant from JWT).
- **Worker iOS:** Same auth (Supabase), same Config and APIClient. Worker uses worker-specific endpoints (worker/day, worker/tasks/today, worker/report/*, sync/*); Manager uses manager endpoints (projects, tasks, reports, workers, ops). No shared UI; shared core only.
