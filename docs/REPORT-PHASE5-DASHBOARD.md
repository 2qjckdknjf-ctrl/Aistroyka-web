# Phase 5 — Manager Dashboard (Web) — Report

**Goal:** Build out high-quality, modern manager/admin dashboard UI using existing v1 API. No backend feature expansion unless strictly required (read-only endpoints OK). No contract breaks.

---

## 0. Inventory (Stage 0)

### 0.1 Existing web pages/routes (`apps/web/app`)

| Route group | Paths | Notes |
|-------------|--------|------|
| Dashboard | `[locale]/(dashboard)/dashboard/page.tsx` | KPI cards, AI insights, recent projects |
| Projects | `projects/page.tsx`, `projects/[id]/page.tsx`, `projects/new/page.tsx`, `projects/[id]/ai/page.tsx` | List, detail, create, AI subpage |
| Team | `team/page.tsx` | TeamPageClient |
| Portfolio | `portfolio/page.tsx` | PortfolioOverview |
| Billing | `billing/page.tsx` | |
| Admin | `admin/page.tsx`, `admin/layout.tsx` (owner/admin only) | |
| Admin sub | `admin/ai/page.tsx`, `admin/ai/requests/page.tsx`, `admin/ai/security/page.tsx`, `admin/governance/page.tsx`, `admin/system/page.tsx`, `admin/trust/page.tsx` | AI usage, requests, security, governance, system, trust |

**Layout:** `[locale]/(dashboard)/layout.tsx` — auth check, `AppLayout` (Nav + main). No sidebar; top Nav only (dashboard, projects, team, portfolio, billing, admin).

**Component library (`apps/web/components`):**
- **UI:** `ui/` — Alert, Badge, Button, Card, Divider, EmptyState, ErrorState, Input, Metric, Modal, SectionHeader, Select, Skeleton/SkeletonCard, Textarea.
- **App:** AppLayout, Nav, NavLogout, BuildStamp.
- **AI:** AiActionPanel, AiErrorBanner, AiStatusBanner, AISignalLine, LowConfidenceBadge, LowConfidenceNotice, CopyRequestIdButton.
- **ui-lite:** Collapsible.

Design tokens: `--aistroyka-*` (radius, space, colors, fonts). No Table or Tabs in ui yet; to be added in Phase 5.

### 0.2 Available APIs (v1 and legacy)

| Area | Method | Endpoint | Auth | Notes |
|------|--------|----------|------|------|
| **Projects** | GET | `/api/v1/projects` | Yes | List projects (via project.service). |
| | GET | `/api/projects/[id]` | Yes | Project detail (getProjectById RPC). No `/api/v1/projects/:id` yet. |
| | POST | `/api/v1/projects` | Yes | Create project. |
| **Worker** | GET | `/api/v1/worker/tasks/today` | Yes | Current user's tasks. |
| | POST | `/api/v1/worker/day/start` | Yes | Start day. |
| | POST | `/api/v1/worker/day/end` | Yes | End day. |
| | POST | `/api/v1/worker/report/create` | Yes | Create report. |
| | POST | `/api/v1/worker/report/add-media` | Yes | Add media to report. |
| | POST | `/api/v1/worker/report/submit` | Yes | Submit report. |
| | GET | `/api/v1/worker` | Yes | 501 stub. |
| **Media** | POST | `/api/v1/media/upload-sessions` | Yes | Create session. |
| | POST | `/api/v1/media/upload-sessions/:id/finalize` | Yes | Finalize. No GET list for manager. |
| **Reports** | GET | `/api/v1/reports/[id]/analysis-status` | Yes | Analysis status for report. No list reports. |
| **Sync** | GET | `/api/v1/sync/bootstrap` | Yes | Bootstrap. |
| | GET | `/api/v1/sync/changes` | Yes | Changes. |
| | POST | `/api/v1/sync/ack` | Yes | Ack. |
| **Devices** | POST | `/api/v1/devices/register` | Yes | Register token. |
| | POST | `/api/v1/devices/unregister` | Yes | Unregister. No list devices. |
| **Admin** | GET | `/api/v1/admin/jobs` | Admin | Failed jobs (getFailedJobs). |
| | GET | `/api/v1/admin/ai/usage` | Admin | AI usage (getAiUsageFromLogs). |
| | POST | `/api/v1/admin/push/test` | Admin | Enqueue test push. No list push outbox. |
| **Other** | GET | `/api/v1/config` | Yes | Config. |
| | GET | `/api/v1/health` | No | Health. |

**Gaps for dashboard (to be added only if UI cannot be implemented otherwise):**
- **Projects:** Optional `GET /api/v1/projects/:id` (or use existing `GET /api/projects/[id]`). Optional `GET /api/v1/projects/:id/summary` for counts.
- **Workers / reports:** No manager list of workers, worker days, or reports; add read-only e.g. `GET /api/v1/projects/:id/workers`, `GET /api/v1/projects/:id/reports` (or tenant-scoped with project filter).
- **Upload sessions:** No list; add read-only `GET /api/v1/media/upload-sessions` (tenant-scoped, filters: status, project, date).
- **Devices:** No list; add read-only `GET /api/v1/admin/devices` or `GET /api/v1/projects/:id/devices` (policy TBD).
- **Push outbox:** No list; add read-only `GET /api/v1/admin/push/outbox`.
- **AI:** Admin AI usage exists; optional drilldown by report/media/artifact if needed.

### 0.3 Screens list (target)

| # | Screen | Route (target) | Purpose |
|---|--------|-----------------|---------|
| 1 | Dashboard shell | `/[locale]/dashboard` (enhanced) | Sidebar + topbar, tenant/project switch, search, RBAC-gated nav. |
| 2 | Overview | `/dashboard` or `/dashboard/overview` | KPI summary, quick links. |
| 3 | Projects list | `/dashboard/projects` | Table: name, status, last activity, counts. |
| 4 | Project detail | `/dashboard/projects/[id]` | Overview cards, tabs: Workers, Reports, Uploads, AI. |
| 5 | Workers list | `/dashboard/workers` or under project | Workers, last day status, last report. |
| 6 | Worker day timeline | `/dashboard/workers/[id]/days` or inline | Day start/end, durations. |
| 7 | Reports list | `/dashboard/reports` or under project | By project/date/worker, status. |
| 8 | Report detail | `/dashboard/reports/[id]` | Notes, media, AI status/summary. |
| 9 | Upload sessions | `/dashboard/uploads` | Status badges, filters. |
| 10 | Media gallery | `/dashboard/uploads/media` or modal | Media attached to reports. |
| 11 | Devices / Sync health | `/dashboard/devices` | device_id, platform, last_seen, last_cursor, conflicts. |
| 12 | AI insights | `/dashboard/ai` | Analyses table, drilldown. |
| 13 | Admin — Push outbox | `/admin/push-outbox` (admin-only) | Pending/sent/failed, attempts, errors. |
| 14 | Admin — Jobs status | `/admin/jobs` (admin-only) | Failed jobs, queue depth if available. |
| 15 | Global search / filters | Topbar + query params | By project, worker, date range. |

---

## 1. Dashboard shell (Stage 1)

*To be filled after implementation.*

- Layout: sidebar (Overview, Projects, Workers, Reports, Uploads, Devices/Sync, AI, Admin), topbar (tenant, project, date range, search, user).
- RBAC: Admin nav visible only for owner/admin; server-side protection on `/admin/*` (existing).
- UI kit: Table, Tabs, Dialog, Skeleton, empty states (standardized).

---

## 2. Projects (Stage 2)

**Done.**

- **Routes:** `/dashboard/projects` (list), `/dashboard/projects/[id]` (detail with overview cards + tabs).
- **APIs used:** `GET /api/v1/projects` (list), `GET /api/v1/projects/:id` (detail), `GET /api/v1/projects/:id/summary` (read-only counts).
- **Read-only endpoint added:** `GET /api/v1/projects/:id/summary` — returns `{ activeWorkers, openReports, aiAnalyses }` from `project-summary.repository.ts` (tenant-scoped).
- **UI:** Table (list with search by name), overview cards (workers, reports, AI, pending uploads), Tabs (Workers, Reports, Uploads, AI) with placeholder content for later stages.
- **Sidebar:** "Projects" now links to `/dashboard/projects`.

---

## 3. Workers + time tracking + reports (Stage 3)

*To be filled after implementation.*

- APIs used / added.

---

## 4. Uploads + media (Stage 4)

*To be filled after implementation.*

---

## 5. Devices / Sync health (Stage 5)

*To be filled after implementation.*

---

## 6. AI insights (Stage 6)

*To be filled after implementation.*

---

## 7. Admin tools (Stage 7)

*To be filled after implementation.*

---

## 8. Polish (Stage 8)

*To be filled after implementation.*

- Search, filters, pagination, accessibility.

---

## 9. Verification

- Commands: `cd apps/web && npm test -- --run`, `npm run build`, `npm run cf:build`.
- Manual test: click-path summary.
- Known follow-ups: Phase 6 production hardening, observability dashboards.

---

## UX map (screens)

```
/dashboard                    → Overview (KPIs, quick links)
/dashboard/projects           → Projects list
/dashboard/projects/[id]      → Project detail (tabs: Workers, Reports, Uploads, AI)
/dashboard/workers            → Workers list (+ date filter)
/dashboard/workers/[id]/days   → Worker day timeline (optional)
/dashboard/reports             → Reports list
/dashboard/reports/[id]        → Report detail (notes, media, AI)
/dashboard/uploads             → Upload sessions
/dashboard/devices             → Devices & sync health
/dashboard/ai                  → AI insights & history
/admin                         → Admin hub (existing)
/admin/push-outbox             → Push outbox viewer (new)
/admin/jobs                    → Jobs status (new or link to existing)
```

*(Routes may be adjusted to fit existing `/projects` vs `/dashboard/projects` convention.)*
