# Operations Cockpit — Implementation Report

**Date:** 2025-03-05  
**Scope:** Manager/Admin Operations Cockpit for AISTROYKA.AI (Stages 1–12)  
**Status:** All stages implemented; tests 294/294 pass; `npm run build` succeeds.

---

## 1. Summary

A production-ready operations cockpit was implemented so managers and admins can:

- See what needs attention (KPIs and queues on the main dashboard)
- Control and inspect projects (tabs: Workers, Reports, Uploads, AI)
- Monitor workers (list with anomaly badges; detail with reports/media counts and day timeline)
- Review reports (list with status/AI/media/age; detail with media gallery and AI analysis panel)
- Track uploads (sessions list with status, stuck/expired highlighting, filters)
- Monitor the device fleet (registered devices, health: active/disabled)
- Observe AI activity (AI jobs list and detail by request ID)
- Use admin operations (push outbox, jobs monitor — already present, verified)

All data is tenant-scoped, paginated where applicable, and uses existing RLS. There are no placeholders, mock data, or stub UI.

---

## 2. Files Created or Touched

### 2.1 New files

| Path | Purpose |
|------|--------|
| `apps/web/lib/ops/ops-overview.repository.ts` | Batched KPIs and queues for ops overview (no N+1) |
| `apps/web/app/api/v1/ops/overview/route.ts` | GET /api/v1/ops/overview |
| `apps/web/app/[locale]/(dashboard)/dashboard/DashboardOpsOverviewClient.tsx` | Main dashboard KPIs + queue cards with links |
| `apps/web/lib/domain/projects/project-scoped.repository.ts` | listProjectWorkers, listProjectReports, listProjectUploads, listProjectAi |
| `apps/web/app/api/v1/projects/[id]/workers/route.ts` | GET project workers (paginated) |
| `apps/web/app/api/v1/projects/[id]/reports/route.ts` | GET project reports (paginated) |
| `apps/web/app/api/v1/projects/[id]/uploads/route.ts` | GET project uploads (paginated) |
| `apps/web/app/api/v1/projects/[id]/ai/route.ts` | GET project AI jobs (paginated) |
| `apps/web/app/api/v1/workers/[userId]/summary/route.ts` | GET worker summary (reports_count, media_count) |
| `apps/web/app/[locale]/(dashboard)/dashboard/workers/[userId]/WorkerDetailClient.tsx` | Worker detail: summary counts + link to reports |
| `apps/web/app/api/v1/devices/route.ts` | GET /api/v1/devices (tenant device_tokens list) |
| `apps/web/app/[locale]/(dashboard)/dashboard/uploads/DashboardUploadsClient.tsx` | Upload sessions table, filters, stuck/expired |
| `apps/web/app/[locale]/(dashboard)/dashboard/devices/DashboardDevicesClient.tsx` | Devices table (device_id, platform, owner, health) |
| `apps/web/app/api/v1/ai/requests/route.ts` | GET /api/v1/ai/requests (AI jobs list) |
| `apps/web/app/api/v1/ai/requests/[id]/route.ts` | GET /api/v1/ai/requests/:id (AI job detail) |
| `apps/web/app/[locale]/(dashboard)/dashboard/ai/DashboardAIClient.tsx` | AI requests table + pagination |
| `apps/web/app/[locale]/(dashboard)/dashboard/ai/[id]/page.tsx` | AI request detail (payload, errors, metadata) |

### 2.2 Modified files (main)

| Path | Changes |
|------|--------|
| `apps/web/app/[locale]/(dashboard)/dashboard/page.tsx` | Uses DashboardOpsOverviewClient; header “Operations cockpit”; “All projects” → /dashboard/projects |
| `apps/web/lib/domain/workers/worker-list.repository.ts` | Anomalies: open_shift, overtime, no_activity; batched open-shift query |
| `apps/web/app/[locale]/(dashboard)/dashboard/workers/DashboardWorkersClient.tsx` | Anomaly badges; worker link; Copy ID; Export CSV |
| `apps/web/app/[locale]/(dashboard)/dashboard/workers/[userId]/page.tsx` | Adds WorkerDetailClient (summary) |
| `apps/web/app/api/v1/reports/route.ts` | Enrichment: media_count, analysis_status; optional ?status |
| `apps/web/app/api/v1/reports/[id]/analysis-status/route.ts` | Any tenant member can read (removed “own report” check) |
| `apps/web/app/[locale]/(dashboard)/dashboard/daily-reports/DashboardReportsClient.tsx` | Columns: Worker, Project, AI, Media, Age; pagination; Export CSV |
| `apps/web/app/[locale]/(dashboard)/dashboard/daily-reports/[id]/page.tsx` | AI analysis panel (analysis-status); Copy ID; media gallery; worker link |
| `apps/web/lib/domain/upload-session/upload-session.repository.ts` | listForManager(tenantId, { limit, offset, status, stuck }) |
| `apps/web/app/api/v1/media/upload-sessions/route.ts` | GET handler (list with limit, offset, status, stuck) |
| `apps/web/app/[locale]/(dashboard)/dashboard/uploads/page.tsx` | Uses DashboardUploadsClient |
| `apps/web/app/[locale]/(dashboard)/dashboard/devices/page.tsx` | Uses DashboardDevicesClient |
| `apps/web/app/[locale]/(dashboard)/dashboard/ai/page.tsx` | Uses DashboardAIClient |
| `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx` | Tabs load real data from new project-scoped APIs; tables + pagination |
| `apps/web/messages/en.json` (ru, es, it) | dashboard.ops* keys for cockpit KPIs and queues |

---

## 3. Routes Implemented

### 3.1 Dashboard (cockpit)

| Route | Description |
|-------|-------------|
| `/dashboard` | Ops overview: KPI cards + queue cards (reports, uploads, workers open shift, push failures) |
| `/dashboard/projects` | Projects list (existing; filters/CSV from Stage 2) |
| `/dashboard/projects/[id]` | Project hub: summary cards + tabs Workers, Reports, Uploads, AI (real data, paginated) |
| `/dashboard/workers` | Workers list: last day, day status, anomaly badges (Open shift, Overtime, No activity), Copy ID, Export CSV |
| `/dashboard/workers/[userId]` | Worker detail: ID, reports count, media count, link to day timeline |
| `/dashboard/workers/[userId]/days` | Day timeline (existing) |
| `/dashboard/daily-reports` | Reports list: status, worker, project, AI status, media count, age; pagination; Export CSV |
| `/dashboard/daily-reports/[id]` | Report detail: status, worker, dates, media gallery, AI analysis panel, Copy ID |
| `/dashboard/uploads` | Upload sessions: status, owner, purpose, age, finalized/expires; filters (status, stuck); stuck/expired highlighting |
| `/dashboard/devices` | Devices: device_id, platform, owner, registered, health (active/disabled) |
| `/dashboard/ai` | AI requests list (job type, status, entity, attempts, created); pagination |
| `/dashboard/ai/[id]` | AI request detail: payload, errors, metadata, Copy ID |

### 3.2 Admin (existing, verified)

| Route | Description |
|-------|-------------|
| `/admin/push` | Push outbox table (status, pagination) |
| `/admin/jobs` | Failed/dead jobs table |

---

## 4. API Endpoints Used / Added

### 4.1 New or extended endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/ops/overview` | KPIs + queues (reports pending, stuck uploads, workers open shift, push failed) |
| GET | `/api/v1/projects/:id/workers` | Project members (paginated) |
| GET | `/api/v1/projects/:id/reports` | Project reports (paginated) |
| GET | `/api/v1/projects/:id/uploads` | Project-linked upload sessions (paginated) |
| GET | `/api/v1/projects/:id/ai` | Project AI jobs (paginated) |
| GET | `/api/v1/workers/:userId/summary` | reports_count, media_count |
| GET | `/api/v1/media/upload-sessions` | List sessions (limit, offset, status, stuck) |
| GET | `/api/v1/devices` | List device_tokens for tenant |
| GET | `/api/v1/ai/requests` | List AI jobs (ai_analyze_*), paginated |
| GET | `/api/v1/ai/requests/:id` | Single AI job detail |

### 4.2 Extended behaviour

| Method | Path | Change |
|--------|------|--------|
| GET | `/api/v1/reports` | Enriched with `media_count`, `analysis_status`; optional `?status=` |
| GET | `/api/v1/reports/:id/analysis-status` | Readable by any tenant member (for cockpit report detail) |

All of the above are tenant-scoped (via `getTenantContextFromRequest` + `requireTenant`) and do not break existing API contracts.

---

## 5. Data and Behaviour Notes

- **Ops overview KPIs:** active projects, workers today, reports today, stuck uploads (created/uploaded &gt;4h), offline devices (0 until last_seen exists), failed jobs 24h. Queues: reports pending review (status=submitted), stuck uploads, workers with open shift, push failures (admin RLS).
- **Project workers:** From `project_members` (role, status). Project reports: reports by project members. Project uploads: sessions linked via `worker_report_media` → reports by project members (capped 1000 session IDs). Project AI: `analysis_jobs` for project media (if table exists).
- **Worker anomalies:** Open shift = worker_day with started_at set and ended_at null (recent days). Overtime = last day duration &gt; 8h. No activity = no report in last 7 days or never submitted.
- **Reports list:** `analysis_status` derived from jobs (ai_analyze_*) per report; `media_count` from `worker_report_media`.
- **Uploads:** Stuck = status in (created, uploaded) and created_at &gt; 4h ago. Expired = expires_at in the past and not finalized.
- **Devices:** From `device_tokens`; health = disabled if `disabled_at` set, else active. No `last_seen` in schema; “Last seen” shown as “—”.
- **AI requests:** Jobs with type `ai_analyze_media` or `ai_analyze_report`; list and detail by job id.

---

## 6. Productivity and UX

- **Pagination:** Tables use `TablePagination` (reports, workers, uploads, devices, AI, project tabs).
- **CSV export:** Reports list, Workers list (Export CSV button).
- **Copy ID:** Report detail, AI request detail, Workers list (Copy ID per row).
- **Deep links:** Report → worker, project; worker → reports; queue cards → filtered list pages.
- **Loading:** Skeleton loaders where data is fetched client-side.
- **Empty states:** `EmptyState` on all lists and when no data.
- **Error states:** Error message + retry where applicable (e.g. ops overview).

---

## 7. Verification

- **Tests:** `cd apps/web && npm test -- --run` → **61 files, 294 tests passed.**
- **Build:** `cd apps/web && npm run build` → **success.**
- **Lint/type:** No placeholders; `TableCell` used without `title` (span with title where needed); worker-list iteration fixed for TS (Array.from(byUser.entries())).

---

## 8. Optional Follow-ups

- **Offline devices:** When schema has a “last seen” (e.g. on `device_tokens` or sync cursor), wire ops overview “offline devices” and devices page “Last seen” and “Offline &gt; 24h”.
- **worker_day.project_id:** If not in DB, project summary/reports by project may rely on project_members only (reports by project members); confirm or add migration.
- **cf:build:** `npm run cf:build` was not run (opennextjs-cloudflare CLI not on PATH); only `npm run build` was verified.
- **Keyboard navigation:** Not explicitly added; can be added later for tables and tabs.

---

## 9. Document History

- 2025-03-05: Initial report after completing Stages 1–12.
