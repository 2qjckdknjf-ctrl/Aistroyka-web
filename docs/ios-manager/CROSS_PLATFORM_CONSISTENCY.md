# Cross-Platform Consistency (Manager, Worker, Web)

**Date:** 2026-03-07

---

## Goal

Manager app, Worker app, and website operate on the same authoritative domain model: same projects, task statuses, report lifecycle, media references, role access, and AI/notification semantics.

## Projects

- **Source of truth:** Supabase `projects` table (tenant-scoped). Listed via GET /api/v1/projects (and legacy /api/projects).
- **Consistency:** Web dashboard, Manager iOS (ProjectsListView), and Worker iOS (ProjectPickerView) all use the same API and DTO shape (id, name). No duplicate definitions.

## Task statuses

- **Backend:** Task status values defined in domain (e.g. open, in_progress, done, cancelled). GET /api/v1/tasks and GET /api/v1/worker/tasks/today return the same status field.
- **iOS:** TaskDTO in Endpoints.swift (shared) has `status: String`. Manager and Worker use the same DTO; UI can map string to display. No divergence.

## Report lifecycle

- **Backend:** Reports created via worker/report/create; media added via worker/report/add-media; submitted via worker/report/submit. Manager lists via GET /api/v1/reports with status, media_count, analysis_status.
- **iOS:** Worker uses WorkerAPI (create, addMedia, submit). Manager uses ManagerAPI.reports() and ReportListItemDTO. Same report id and lifecycle; Manager is read-only/list/detail.

## Media references

- **Backend:** Media stored in Supabase Storage; worker_report_media links report to upload sessions. Manager can show media_count and open report detail (and in future media URLs from GET /api/v1/reports/:id).
- **iOS:** Worker uploads via upload-sessions and add-media. Manager does not upload; consumes media_count and will consume detail when wired. Same media model.

## Role access

- **Backend:** Tenant context from JWT; tenant_members.role (owner, admin, member, viewer). Manager routes require tenant; some routes may restrict to owner/admin.
- **iOS:** Manager app targets manager/owner/admin/foreman; role gating is placeholder until backend exposes role. Worker app does not check role for worker endpoints (tenant membership suffices).

## AI request/response models

- **Backend:** POST /api/v1/ai/analyze-image; GET /api/v1/projects/:id/ai for job list. Analysis status on reports (queued, running, success, failed).
- **iOS:** Worker does not call AI directly from app; reports get analysis server-side. Manager will use GET /api/v1/projects/:id/ai and report analysis_status when AI tab is implemented. Same contracts.

## Notifications

- **Backend:** Devices registered via POST /api/v1/devices/register; push sent by backend. Semantics TBD for manager vs worker.
- **iOS:** Worker registers for push (PushRegistrationService). Manager notifications screen is placeholder; when backend supports manager notifications, same device/tenant model can be used.

## Summary

- **Single domain:** Projects, tasks, reports, media, and tenants are defined and stored once; web and both iOS apps use the same API and DTOs where shared.
- **No parallel APIs:** Manager uses GET /api/v1/projects, tasks, reports (and will use workers, ops); Worker uses worker/* and sync/*. No manager-only backend clones.
- **Consistency maintained by:** Shared Endpoints.swift DTOs, single APIClient, same Config and auth; backend contract docs and OpenAPI/spec can be added later for formal alignment.

---

## Phase 2 deltas (2026-03-07)

- **Manager now wired:** GET /api/v1/me (role gating), GET /api/v1/ops/overview, GET /api/v1/workers, GET /api/v1/reports/:id, GET /api/v1/tasks/:id, POST /api/v1/tasks, GET /api/v1/ai/requests. Same task statuses, report lifecycle, and media references; Manager reads report detail with media list. Worker unchanged.
- **Client identity:** Manager sends x-client: ios_manager; Worker sends ios_lite. Same backend tenant context; no model divergence.
- **Role:** Manager allows owner, admin, member (GET /api/v1/me); foreman can be added when backend exposes it. Worker does not use role for worker flows.
- **AI:** Manager lists AI jobs via GET /api/v1/ai/requests (tenant-scoped); report list still shows analysis_status. GET /api/v1/projects/:id/ai not yet in Manager UI; same backend contract when added.
