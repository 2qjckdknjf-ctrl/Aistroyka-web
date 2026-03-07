# Phase 2 Start — Manager Implementation Audit

**Date:** 2026-03-07  
**Scope:** Current state of AiStroyka Manager before Phase 2 upgrades.

---

## What is already real

- **Auth/session:** AuthService (Supabase sign-in, Keychain), token provider set in ManagerRootView.
- **Projects list:** ManagerAPI.projects() → GET /api/v1/projects; ProjectsListView loads and displays; ProjectDetailPlaceholderView shows name/id.
- **Tasks API:** ManagerAPI.tasks() → GET /api/v1/tasks (DTO + query params); UI is placeholder.
- **Reports API:** ManagerAPI.reports() → GET /api/v1/reports; ReportListItemDTO; UI is placeholder.
- **Bootstrap:** AiStroykaManagerApp, ManagerSessionState, ManagerRootView (login → unauthorized check → tab shell).
- **Tab shell:** Home, Projects, Tasks, Reports, Team, AI, More; each tab has NavigationStack.
- **More:** Sign out, Settings (shows BASE_URL), Notifications placeholder.
- **Shared core:** APIClient, Config, DeviceContext, KeychainHelper, Endpoints (ProjectDTO, TaskDTO, etc.), AuthService, APIError; all via target membership.

---

## What is still placeholder

- **Role gating:** ManagerSessionState.checkRole() allows any logged-in user; no backend role check.
- **Home dashboard:** HomeDashboardView is a text skeleton; no KPIs, no ops/overview, no pull-to-refresh.
- **Tasks tab:** TasksListPlaceholderView shows one line of text; no list, detail, create, or assign.
- **Reports tab:** ReportsInboxPlaceholderView placeholder; no list, filters, or report detail.
- **Team tab:** TeamOverviewPlaceholderView placeholder; GET /api/v1/workers not wired.
- **AI tab:** AICopilotPlaceholderView placeholder; GET /api/v1/projects/:id/ai not wired.
- **Project detail:** ProjectDetailPlaceholderView shows only name and id.
- **Design system:** No reusable KPI/empty/loading/error components; documented only.

---

## Backend endpoints that exist and are not yet wired (Manager iOS)

| Endpoint | Backend exists | Manager wired |
|----------|----------------|---------------|
| GET /api/v1/me (tenant + role) | No | — |
| GET /api/v1/ops/overview | Yes | No |
| GET /api/v1/org/metrics/overview | Yes | No |
| GET /api/v1/workers | Yes | No (ManagerAPI only; no UI) |
| GET /api/v1/reports/:id | Yes | No |
| GET /api/v1/tasks/:id | Yes | No |
| POST /api/v1/tasks | Yes | No |
| POST /api/v1/tasks/:id/assign | Yes | No |
| GET /api/v1/projects/:id | Yes | No (detail placeholder) |
| GET /api/v1/projects/:id/ai | Yes | No |

---

## UX/product gaps blocking real manager usage

- Manager cannot distinguish itself from Worker (same x-client: ios_lite).
- Any logged-in user can open Manager (no role gating).
- No dashboard KPIs or “needs attention” queues.
- Cannot view team/workers or worker activity.
- Cannot open report detail or review reports.
- Cannot list/filter tasks, open task detail, create task, or assign.
- No shared design system (loading/empty/error) for consistent UX.
- AI tab has no connection to project AI or analysis status.

---

## Technical debt

- **x-client:** Hardcoded "ios_lite" in APIClient; backend ClientProfile has no "ios_manager".
- **Role:** No GET /api/v1/me; backend has role in tenant context but does not expose it to clients.
- **Design system:** MANAGER_DESIGN_SYSTEM.md is conceptual only; no Swift components.
- **Config payload:** getConfigPayload does not return role; would need new endpoint or extended config for role.
