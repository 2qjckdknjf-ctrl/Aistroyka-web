# Cockpit Screens — Routes & Click-Paths

Phase 5.1 MAX operations cockpit. All routes under `/[locale]/` (locale prefix).

---

## Routes

| # | Screen | Route | Auth | Notes |
|---|--------|--------|------|--------|
| 1 | Ops Overview | `/dashboard` | Yes | KPI + needs-attention queues |
| 2 | Projects list | `/dashboard/projects` | Yes | Table, filters, CSV |
| 3 | Project detail | `/dashboard/projects/[id]` | Yes | Tabs: Workers, Reports, Uploads, AI |
| 4 | Workers list | `/dashboard/workers` | Yes | Anomaly badges, sort by attention |
| 5 | Worker days | `/dashboard/workers/[userId]/days` | Yes | Day timeline, durations |
| 6 | Reports list | `/dashboard/daily-reports` | Yes | Status, AI status, media count |
| 7 | Report detail | `/dashboard/daily-reports/[id]` | Yes | Media gallery, AI panel, deep link |
| 8 | Upload monitoring | `/dashboard/uploads` | Yes | Status, stuck highlight, filters |
| 9 | Devices / Sync | `/dashboard/devices` | Yes | Fleet, last_seen, health |
| 10 | AI Cockpit | `/dashboard/ai` | Yes | Requests list, drilldown |
| 11 | Admin — Push outbox | `/admin/push-outbox` | Admin | Outbox viewer |
| 12 | Admin — Jobs | `/admin/jobs` | Admin | Failed jobs, health |
| 13 | Admin — System | `/admin/system` | Admin | Existing system page |

---

## Click-Paths (operator flows)

### Daily check

1. Open **Overview** (`/dashboard`) → scan KPI and “Needs attention”.
2. Click queue item → deep link to filtered list (e.g. reports pending AI, stuck uploads).
3. **Workers** → sort “Needs attention first” → open worker → **Days** to confirm missing end/overtime.
4. **Reports** → filter by status → open report → check AI status, media.
5. **Uploads** → filter stuck/expired → reconcile hint.
6. **Devices** → check offline > 24h.
7. **(Admin)** **Push outbox** → failed; **Jobs** → failed/dead.

### Project hub

1. **Projects** → open project.
2. Tabs: **Workers** (project), **Reports** (project), **Uploads** (project), **AI** (project).
3. Copy ID, quick links.

### Command Palette (⌘K)

- “Go to project …” → navigate to project.
- “Open report …” → navigate to report.
- “Copy current page link” → copy URL.
- “Export table as CSV” → export current table.

---

## Filter bar (universal)

- **project_id**, **worker_id**, **from**, **to**, **status**, **q**.
- Persisted in URL; shared across list pages.
- Saved views (localStorage) for quick presets.
