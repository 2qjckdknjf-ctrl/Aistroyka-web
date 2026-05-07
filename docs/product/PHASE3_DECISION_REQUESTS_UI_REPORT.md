# Phase 3 — Decision requests (UI)

**Date:** 2026-05-07

## Manager — project detail

- **Tab:** “Decisions” on `DashboardProjectDetailClient` (`?tab=decisions`).
- **Panel:** `ProjectDecisionsPanel.tsx`
  - Lists all requests via `GET /api/v1/projects/:id/decision-requests?status=all`.
  - **Create:** form posts to `POST /api/v1/projects/:id/decision-requests` (canonical `type` + `title` + optional `description`, `due_at`, customer amount for `estimate_approval`).
  - **Overdue:** badge when `status === open`, `due_at` in the past.
  - Link to **customer portal** subtree (`/dashboard/projects/:id/client`).

## Customer / stakeholder

- Existing **client portal** surfaces (`ClientPortalRequestsSection`, etc.) show open requests and collect responses.
- **Respond URL (canonical portal path):** `POST /api/v1/portal/projects/:projectId/decisions/:requestId/respond` (same handler as `client-requests/.../respond`).

## Manager workload / Daily Control Center

- `buildManagerWorkload` aggregates open `action_required` client requests per project.
- If any open request has `due_at` in the past → **urgent**, title “Overdue customer decisions”, `due_state: overdue`, action URL `...?tab=decisions`.

## i18n

- Keys under `dashboardDetail.decisionRequests*` in `en`, `ru`, `es`, `it`.

## Gaps / follow-ups (non-blocking)

- Rich linking UI (pick document/milestone inline) can extend the create form; API already supports `linked_entity_*`.
- Stakeholder-facing dedicated `/portal/projects/[id]` hub (vs dashboard client subtree) remains a Phase 2 optional follow-up.
