# Phase 5.2 — Manager/Admin Operations Cockpit — Build Report

**Date:** 2025-03-06  
**Scope:** apps/web — fully working Operations Cockpit (manager + admin).  
**Quality gates:** `npm test -- --run` and `npm run cf:build` passing.

---

## 1. Routes and screens

All routes exist and render. Sidebar and RBAC nav are in `DashboardShell`; admin links only when `isAdmin` is true.

| Route | Description | RBAC |
|-------|-------------|------|
| `/dashboard` | Ops overview: KPI cards + queues (reports, stuck uploads, open shifts, AI failed, push failures) | Tenant member |
| `/dashboard/projects` | Projects list with FilterBar, pagination, CSV export | Tenant member |
| `/dashboard/projects/[id]` | Project detail | Tenant member |
| `/dashboard/workers` | Workers list | Tenant member |
| `/dashboard/workers/[id]` | Worker detail | Tenant member |
| `/dashboard/reports` | Daily reports list with FilterBar, pagination, CSV export | Tenant member |
| `/dashboard/reports/[id]` | Report detail (media, AI analysis status) | Tenant member |
| `/dashboard/uploads` | Upload sessions with FilterBar, pagination, CSV export | Tenant member |
| `/dashboard/devices` | Devices (push tokens) with FilterBar, pagination, CSV export | Tenant member |
| `/dashboard/ai` | AI requests list with FilterBar, pagination, CSV export | Tenant member |
| `/dashboard/ai/[id]` | AI request detail (payload, errors) | Tenant member |
| `/admin/push` | Push outbox viewer (admin only) | Admin/Owner |
| `/admin/jobs` | Failed/dead jobs (admin only) | Admin/Owner |

Legacy path `/dashboard/daily-reports` and `/dashboard/daily-reports/[id]` still work (same components, optional `basePath`).

---

## 2. Endpoints used / added

### Existing, used as-is or with query extensions

- **GET /api/v1/projects** — list projects (FilterBar, projects list).
- **GET /api/v1/projects/[id]** — project detail.
- **GET /api/v1/workers** — list workers (FilterBar, worker dropdowns).
- **GET /api/v1/workers/[userId]/summary** — worker detail.
- **GET /api/v1/reports** — list reports. **Extended:** `worker_id` (alias `user_id`), `from`, `to`, `project_id`, `status`; repo filters by `userId`, date range.
- **GET /api/v1/reports/[id]** — report detail.
- **GET /api/v1/reports/[id]/analysis-status** — AI analysis status for report.
- **GET /api/v1/media/upload-sessions** — list sessions. **Extended:** `user_id` (alias `worker_id`), `from`, `to`; repo filters by `userId`, `from`, `to`.
- **GET /api/v1/devices** — list devices. **Extended:** `platform`, `from`, `to`.
- **GET /api/v1/ai/requests** — list AI jobs. **Extended:** `from`, `to`.
- **GET /api/v1/ai/requests/[id]** — AI job detail.
- **GET /api/v1/ops/overview** — KPIs + queues. **Extended:** `from`, `to`, `project_id`; added queue `aiFailed` (AI jobs failed/dead in 24h).
- **GET /api/v1/admin/push/outbox** — push outbox. **Extended:** `from`, `to`. Admin-only (requireAdmin after requireTenant).
- **GET /api/v1/admin/jobs** — failed jobs. Admin-only. No new endpoint; CSV and copy-ID in UI.

All list endpoints are tenant-scoped and support pagination (limit/offset or page/pageSize via URL params). No v1 API contracts broken; idempotency, sync, upload finalize, Lite allow-list unchanged.

---

## 3. RBAC summary

- **Layout:** `(dashboard)/layout.tsx` — requires authenticated user; resolves `isAdmin` via `requireAdmin(supabase)` and passes to `DashboardShell`.
- **Admin layout:** `(dashboard)/admin/layout.tsx` — redirects non-admin to `/{locale}/dashboard`. Admin = tenant_members.role in (`owner`, `admin`).
- **API admin routes:** `GET /api/v1/admin/push/outbox` and `GET /api/v1/admin/jobs` call `requireAdmin(ctx, "read")` after `requireTenant(ctx)`; 403 if not admin/owner.
- **Manager pages:** All `/dashboard/*` (including reports, uploads, devices, ai) are tenant-scoped; any tenant member can access. Devices and uploads use same tenant context.

---

## 4. Universal FilterBar and URL params

- **FilterBar** (`@/components/cockpit/FilterBar`): project_id, worker_id, from, to, status, q (search). Persisted in URL via `useFilterParams` (next-intl router replace). Compatible with pagination (page, pageSize); filter changes reset page to 1.
- **Wired into:** Reports, Uploads, Devices, AI. Projects already had FilterBar. Overview uses deep links with query params (e.g. `/dashboard/reports?status=submitted`, `/dashboard/uploads?stuck=1`, `/dashboard/ai?status=failed`, `/admin/push?status=failed`).

---

## 5. Ops overview

- **KPI cards:** active projects, active workers today, reports today, stuck uploads, offline devices, failed jobs (24h).
- **Queues:** reports pending review, stuck uploads (>4h), workers with open shift, **AI failed (24h)** (new), push failures (admin). Each item links to the relevant list/detail with filters applied; “View all” links to list with appropriate query.

---

## 6. Lists: pagination, loading, empty, error, filters

- Every list page: **pagination** (TablePagination, server- or client-side as appropriate), **loading** (Skeleton), **empty** (EmptyState), **error** (message + retry where applicable), **filters** (FilterBar or status/platform dropdowns).
- **CSV export:** Reports, Uploads, Devices, AI list, Admin Push outbox, Admin Jobs.
- **Copy ID / deep link:** Report detail, AI detail, Admin Push (ID click to copy), Admin Jobs (ID click to copy).

---

## 7. Manual verification click-paths

1. **Login** → redirect to `/dashboard` (or locale prefix).
2. **Dashboard** → see KPI cards and queue cards; click “View all” on e.g. Reports → `/dashboard/reports`; click “View all” on Stuck uploads → `/dashboard/uploads?stuck=1` (or status=stuck in FilterBar).
3. **Reports** → `/dashboard/reports`; set project, worker, date range, status; paginate; Export CSV; open a report → `/dashboard/reports/[id]`; Copy ID; back to reports.
4. **Uploads** → `/dashboard/uploads`; filter by worker, date, status (including “Stuck >4h”); paginate; Export CSV.
5. **Devices** → `/dashboard/devices`; filter by platform, date; paginate; Export CSV.
6. **AI** → `/dashboard/ai`; filter by status, date; paginate; Export CSV; open request → `/dashboard/ai/[id]`; Copy ID; view payload/errors.
7. **Admin (as admin)** → sidebar shows Admin section; **Push** → `/admin/push`; filter by status; paginate; Export CSV; click ID to copy. **Jobs** → `/admin/jobs`; filter by status; Export CSV; click ID to copy.
8. **Admin (as non-admin)** → no Admin in sidebar; direct navigate to `/admin/push` or `/admin/jobs` → redirect to `/{locale}/dashboard`.

---

## 8. Build and test

- `cd apps/web && npm test -- --run` — 61 test files, 294 tests passed.
- `cd apps/web && npm run cf:build` — Next build + OpenNext Cloudflare build complete (with `--dangerouslyUseUnsupportedNextVersion` for Next 14).

---

## 9. Files touched (summary)

- **Shell/nav:** `DashboardShell.tsx` (sidebar link reports → `/dashboard/reports`).
- **Routes/pages:** `dashboard/reports/page.tsx`, `dashboard/reports/[id]/page.tsx`; `dashboard/daily-reports/DashboardReportsClient.tsx` (basePath, FilterBar, params).
- **Overview:** `DashboardOpsOverviewClient.tsx` (links to `/dashboard/reports`, queue AI failed); `lib/ops/ops-overview.repository.ts` (from/to/project_id, aiFailed queue); `app/api/v1/ops/overview/route.ts` (from, to, project_id).
- **Reports:** `lib/domain/reports/report-list.repository.ts` (userId, from/to in query); `app/api/v1/reports/route.ts` (worker_id).
- **Uploads:** `lib/domain/upload-session/upload-session.repository.ts` (userId, from, to); `app/api/v1/media/upload-sessions/route.ts`; `DashboardUploadsClient.tsx` (FilterBar, server pagination, CSV).
- **Devices:** `app/api/v1/devices/route.ts` (platform, from, to); `DashboardDevicesClient.tsx` (FilterBar, pagination, CSV).
- **AI:** `app/api/v1/ai/requests/route.ts` (from, to); `DashboardAIClient.tsx` (FilterBar, pagination, CSV).
- **Admin:** `lib/platform/push/push-outbox.repository.ts` (from, to); `app/api/v1/admin/push/outbox/route.ts`; `AdminPushOutboxClient.tsx` (CSV, copy ID); `AdminJobsClient.tsx` (CSV, copy ID).
- **i18n:** `messages/en.json`, `es.json`, `it.json`, `ru.json` (queueAiFailures).
- **Build:** `package.json` (cf:build with `--dangerouslyUseUnsupportedNextVersion`).

No placeholder or mock data; all lists and details use live APIs with tenant context and (where required) admin checks.
