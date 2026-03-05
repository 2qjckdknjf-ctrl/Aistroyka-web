# Phase 5.1 MAX — Manager/Admin Operations Cockpit — Report

**Goal:** Elite operations cockpit: fast, tactile, decision-oriented. Existing v1 API + minimal read-only/aggregation endpoints. No contract breaks.

---

## Stage 0 — Inventory + Design System Lock-In

### 0.1 Dashboard routes and components (existing)

- **Shell:** `DashboardShell` (sidebar + topbar), `dashboard-nav.utils` (RBAC).
- **Routes:** `/dashboard`, `/dashboard/projects`, `/dashboard/projects/[id]`, `/dashboard/workers`, `/dashboard/workers/[userId]/days`, `/dashboard/daily-reports`, `/dashboard/daily-reports/[id]`, `/dashboard/uploads`, `/dashboard/devices`, `/dashboard/ai`; `/admin/*` (admin-only).
- **UI (components/ui):** Alert, Badge, Button, Card, Divider, EmptyState, ErrorState, Input, Metric, Modal, SectionHeader, Select, Skeleton/SkeletonCard, Table (no pagination), Tabs, Textarea.

### 0.2 Design tokens and UI kit extension

- **Tokens:** `--aistroyka-*` in `app/design-tokens.css` (colors, spacing, radius, typography, shadows, badges).
- **Added for cockpit:**
  - **TablePagination** — page size, prev/next, page indicator (uses tokens).
  - **Chip/Tag** — filter chips / status tags (Badge exists; Chip for removable/toggle).
  - **DateRangePicker** — simple from/to inputs or preset buttons (7d, 30d, 90d).
  - **Toast** — transient message (client state or context).
  - **DropdownMenu** — trigger + menu list for actions/user menu.

### 0.3 Report skeleton

Sections below filled per stage.

### 0.4 UX map

See `docs/UX/COCKPIT_SCREENS.md`.

---

## Stage 1 — Cockpit Shell (Sidebar + Topbar + Command Palette)

*To be filled.*

- Sidebar: Overview, Projects, Workers, Reports, Uploads, Devices/Sync, AI; Admin (Push Outbox, Jobs, System).
- Topbar: tenant, project filter, date range, search, user menu, build stamp.
- Command Palette (⌘K): navigate, copy link, export CSV.
- RBAC: admin nav hidden for non-admin; server protect /admin.

---

## Stage 2 — Universal Filter Bar + Saved Views

*To be filled.*

- FilterBar: project_id, worker_id, from, to, status, q → URL query params.
- Saved views: localStorage presets.
- CSV export for tables.

---

## Stage 3 — Ops Overview (What Needs Attention)

*To be filled.*

- KPI cards + “needs attention” queues.
- Optional: `GET /api/v1/ops/overview`.
- Deep links to filtered pages.

---

## Stage 4 — Project Detail Tabs (Real Data)

*To be filled.*

- Tabs: Workers, Reports, Uploads, AI — wired to real endpoints.
- Endpoints: projects/:id/workers, /reports, /uploads, /ai (paginated).

---

## Stage 5 — Workers + Time Ops (Anomalies)

*To be filled.*

- Badges: on-shift, finished, missing-end, overtime.
- “Needs attention first” sort.
- Anomaly classification unit test.

---

## Stage 6 — Reports UX (Media + AI Status)

*To be filled.*

- List: status chip, AI status, media count, bulk CSV.
- Detail: media gallery, AI status panel, refresh, deep link.

---

## Stage 7 — Upload Monitoring

*To be filled.*

- Upload sessions: status, age, owner, project, stuck highlight.
- `GET /api/v1/media/upload-sessions` (paginated).

---

## Stage 8 — Devices & Sync Health

*To be filled.*

- Devices: last_seen, last_cursor, health badge, offline > 24h.
- `GET /api/v1/devices` or admin variant.

---

## Stage 9 — AI Cockpit

*To be filled.*

- AI requests list + drilldown.
- `GET /api/v1/ai/requests`, `/api/v1/ai/requests/:id`.

---

## Stage 10 — Admin Monitoring

*To be filled.*

- Push outbox viewer: `GET /api/v1/admin/push/outbox`.
- Jobs: existing `/api/v1/admin/jobs`, optional summary.
- Job processing health panel.

---

## Stage 11 — Polish

*To be filled.*

- Pagination on all tables, skeletons, empty/error states.
- Keyboard nav, a11y.
- No N+1; batching/aggregates.

---

## Stage 12 — Verification + Operator Playbook

*To be filled.*

- Tests, cf:build.
- Manual verification paths.
- `docs/UX/OPERATOR_PLAYBOOK.md`: daily checklists, alert responses.

---

## Endpoints added (summary)

| Endpoint | Method | Scope | Purpose |
|----------|--------|-------|---------|
| *(to be filled per stage)* | | | |

---

## RBAC summary

- **Viewer:** read projects, reports, workers (own or tenant); no write.
- **Manager/Member:** + create/edit own; dashboard ops overview, filters, export.
- **Admin/Owner:** + admin nav (Push Outbox, Jobs, System); admin endpoints.

---

## Performance notes

- Pagination on all list endpoints (default limit 50, max 200).
- Ops overview: single aggregate or batched server fetch; no N+1.
- Client: no heavy fetch loops; server components + route handlers preferred.
