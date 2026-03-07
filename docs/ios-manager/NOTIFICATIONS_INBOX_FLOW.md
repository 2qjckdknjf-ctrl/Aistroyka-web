# Notifications Inbox Flow (Phase 4)

**Date:** 2026-03-07  
**Scope:** Backend GET/PATCH + iOS manager inbox.

---

## Backend

- **GET /api/v1/notifications?limit=&offset=**
  - Tenant-scoped; returns notifications for current user (ctx.userId).
  - Response: `{ data: [{ id, type, title, body?, created_at, read_at?, target_type?, target_id? }], total }`.

- **PATCH /api/v1/notifications/:id/read**
  - Marks notification as read (sets read_at). Tenant + user scoped.
  - Response: `{ ok: true }` or 404.

- **Table:** `manager_notifications` (id, tenant_id, user_id, type, title, body, read_at, target_type, target_id, created_at). RLS: tenant_members.

- **Producers:** `notifyTenantManagers()` called from:
  - Report submit (type: report_submitted, target_type: report, target_id: reportId).
  - Task assign (type: task_assigned, target_type: task, target_id: taskId).
  - One row per tenant manager (owner, admin, member).

## iOS

- **ManagerAPI.notifications(limit:offset:)** → GET; returns (items, total).
- **ManagerAPI.markNotificationRead(id:)** → PATCH :id/read.
- **NotificationsView:** Inbox list first; read/unread indicator; tap marks read; optional "Registered devices" disclosure for diagnostics.
- **Navigation to target:** target_type/target_id supported by API; iOS can deep link to task/report when navigation stack allows (documented for future).
