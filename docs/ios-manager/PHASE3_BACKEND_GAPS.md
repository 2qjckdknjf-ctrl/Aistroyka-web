# Phase 3 Backend Gaps

**Date:** 2026-03-07  
**Scope:** Missing backend contracts blocking full manager operations.

---

## 1. Report approval / review state

| Item | Detail |
|------|--------|
| **Desired user action** | Manager approves report, marks as reviewed, or requests changes. |
| **Endpoint needed** | PATCH /api/v1/reports/:id with body e.g. { status: "approved" \| "reviewed" \| "changes_requested", note?: string }. |
| **Current** | GET /api/v1/reports/:id (read-only). Worker submit flow only. |
| **Why insufficient** | No way to persist manager review state. |
| **Minimal contract** | PATCH /api/v1/reports/:id { status, manager_note? }; 200 + updated report or 403/404. |
| **Priority** | High |

---

## 2. Notifications inbox

| Item | Detail |
|------|--------|
| **Desired user action** | Manager sees list of notifications (alerts, task assigned, report submitted, etc.) and can mark read / open target. |
| **Endpoint needed** | GET /api/v1/notifications (tenant-scoped, paginated); optionally PATCH :id/read. |
| **Current** | GET /api/v1/devices (device list only). Push send exists; no inbox. |
| **Why insufficient** | No notification list or read state for manager. |
| **Minimal contract** | GET /api/v1/notifications?limit=&offset= → { data: [{ id, type, title, body?, created_at, read_at?, target_type?, target_id? }], total }. |
| **Priority** | High |

---

## 3. Richer project detail (optional)

| Item | Detail |
|------|--------|
| **Desired** | Project detail with more metadata (e.g. status, settings). |
| **Current** | GET /api/v1/projects/:id returns id, name, tenant_id, created_at; summary gives counts. |
| **Why insufficient** | Optional; current payload is sufficient for Phase 3. |
| **Priority** | Medium |

---

## 4. User / assignee directory (optional)

| Item | Detail |
|------|--------|
| **Desired** | Dedicated endpoint for assignable users with display name. |
| **Current** | GET /api/v1/workers returns user_id and activity; used as assignee list. |
| **Why insufficient** | Workers list is sufficient for assign; display names would improve UX. |
| **Priority** | Medium |

---

## 5. Manager action audit trail (optional)

| Item | Detail |
|------|--------|
| **Desired** | Log of manager actions (assign, approve, etc.) for audit. |
| **Current** | Not implemented. |
| **Priority** | Medium |
