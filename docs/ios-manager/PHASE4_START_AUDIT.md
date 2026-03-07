# Phase 4 Start Audit — Backend Governance + Manager Operations Completion

**Date:** 2026-03-07  
**Scope:** Backend contracts and iOS wiring to close manager governance gaps.

---

## Workflows already end-to-end complete (Phase 2/3)

| Workflow | Status |
|----------|--------|
| Dashboard (KPIs + queues) | ✅ Loads; no deep links yet |
| Projects list → project detail → tasks/reports/AI | ✅ |
| Tasks list/detail/create | ✅ |
| Task assign | ✅ POST tasks/:id/assign; assignee picker from workers |
| Reports list/detail | ✅ Read-only; review actions shell only |
| Team/workers | ✅ |
| Tenant-level AI | ✅ |
| Per-project AI | ✅ |
| Notifications | Device list or empty; no inbox API |

## Workflows still read-only or shell

| Workflow | Blocker |
|----------|---------|
| Report review | No PATCH reports/:id; manager cannot approve/review/request changes |
| Notifications inbox | No GET /api/v1/notifications; no read state |
| Dashboard → task/report | No navigation from “Needs attention” to task/report detail |
| Manager action history | No audit exposure; backend audit_logs exist but assign not consistently logged |

## Backend contracts required

1. **Report review write** — PATCH /api/v1/reports/:id  
   Body: `{ status?: "approved" | "reviewed" | "changes_requested", manager_note?: string }`  
   Allowed from status `submitted` only. Persist reviewed_at, reviewed_by, manager_note. Audit log.

2. **Notifications inbox** — GET /api/v1/notifications?limit=&offset=  
   Response: `{ data: [{ id, type, title, body?, created_at, read_at?, target_type?, target_id? }], total }`  
   Optional: PATCH /api/v1/notifications/:id/read.

3. **Manager action audit** — Use existing audit_logs; ensure task_assignment and report_review are written. Optional: GET /api/v1/audit/manager-actions for admin.

4. **Dashboard deep links** — Backend already returns task/report ids in ops/overview; iOS only needs navigation.

5. **Assignee identity** — Optional: enrich GET /api/v1/workers with display_name (profile/auth) or document limitation.

## Changes: backend-only vs backend + iOS

| Item | Backend | iOS |
|------|---------|-----|
| Report review | PATCH route, migration (reviewed_at, reviewed_by, manager_note), audit | Real buttons, PATCH call, refresh |
| Notifications inbox | Table, GET + optional PATCH read | Inbox list, read state, open target |
| Audit trail | Persist in audit_logs from assign + report review; optional GET | Optional later; not required Phase 4 |
| Dashboard deep links | None | NavigationLink from queues to task/report/project |
| Assignee identity | Optional enrich workers | Show display_name if present |

## Strict priority order for Phase 4

1. Report review write flow (backend + iOS)
2. Notifications inbox API + Manager UI wiring
3. Manager action audit trail (backend persistence; optional GET)
4. Dashboard deep links (iOS)
5. Assignee identity improvement (optional)
6. UX hardening (review bar, status badges, toasts)
