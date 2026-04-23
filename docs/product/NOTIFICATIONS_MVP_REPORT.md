# NOTIFICATIONS / REMINDERS — MVP REPORT

## 1. What was added

### New files

- `apps/web/supabase/migrations/20260322500000_manager_notifications_project_id.sql` — adds `project_id` for deep-link routing
- `apps/web/app/api/v1/notifications/unread-count/route.ts` — GET unread count
- `apps/web/app/api/v1/notifications/read-all/route.ts` — PATCH mark all read
- `apps/web/components/NotificationBadge.tsx` — header link with unread badge
- `apps/web/app/[locale]/(dashboard)/dashboard/notifications/page.tsx` — notifications page
- `apps/web/app/[locale]/(dashboard)/dashboard/notifications/NotificationsClient.tsx` — list UI, mark read, deep links
- `apps/web/lib/domain/notifications/manager-notifications.repository.test.ts` — repository tests
- `docs/product/NOTIFICATIONS_MVP.md` — scope documentation
- `docs/product/NOTIFICATIONS_MVP_REPORT.md` — this report

### Existing files extended

- `apps/web/lib/domain/notifications/manager-notifications.repository.ts` — added `unreadCount`, `markAllRead`, `project_id` in select and `CreateManagerNotificationInput`

---

## 2. What was changed

- **manager-notifications.repository.ts** — added `unreadCount`, `markAllRead`; added `project_id` to row type, insert input, and `listForUser` select
- **issue.service.ts** — create/update issue → `notifyTenantManagers` with `issue_created`, `issue_status_changed`
- **document.service.ts** — document under_review / resubmit → `document_under_review`, `document_resubmitted`
- **document-decision.service.ts** — owner decision → `document_owner_decision`
- **report.service.ts** — report submitted (already present, no change)
- **tasks assign API** — task assigned → added `project_id` to notification
- **DashboardShell.tsx** — added nav link for notifications, `NotificationBadge`
- **GET /api/v1/notifications** — extended response with `project_id` for deep links

---

## 3. Notification model

**Table:** `manager_notifications`

| Field        | Type         | Purpose                           |
|-------------|--------------|-----------------------------------|
| id          | uuid         | PK                                |
| tenant_id   | uuid         | tenant scope                      |
| user_id     | uuid         | recipient                         |
| type        | text         | event type (e.g. issue_created)   |
| title       | text         | notification title                |
| body        | text (null)  | optional body                      |
| read_at     | timestamptz  | null = unread                     |
| target_type | text (null)  | issue, document, report, task     |
| target_id   | uuid (null)  | related entity id                 |
| project_id  | uuid (null)  | project for deep links            |
| created_at  | timestamptz  | created                           |

**Event types:** `issue_created`, `issue_status_changed`, `document_under_review`, `document_owner_decision`, `document_resubmitted`, `report_submitted`, `task_assigned`.

**Read/unread:** `read_at IS NULL` = unread.

---

## 4. Event integration

| Workflow point                    | File                          | Type(s)                  | Recipients        |
|----------------------------------|-------------------------------|--------------------------|-------------------|
| Issue created                    | issue.service.ts              | issue_created            | tenant managers   |
| Issue → in_review/resolved/closed| issue.service.ts              | issue_status_changed     | tenant managers   |
| Document → under_review          | document.service.ts           | document_under_review    | tenant managers   |
| Owner decision (approve/reject)  | document-decision.service.ts  | document_owner_decision  | tenant managers   |
| Manager resubmit                 | document.service.ts           | document_resubmitted     | tenant managers   |
| Report submitted                 | report.service.ts             | report_submitted         | tenant managers   |
| Task assigned                    | tasks assign API              | task_assigned            | tenant managers   |

**Targeting:** `notifyTenantManagers` → tenant_members with role in (owner, admin, member). No owner-specific targeting in MVP.

---

## 5. UI flow

- **Entry:** Sidebar link "Notifications" + `NotificationBadge` (bell icon with unread count, max 99+)
- **Page:** `/dashboard/notifications` — list of notifications, table with title, date, read/unread, action
- **Unread count:** Fetched from `GET /api/v1/notifications/unread-count`; badge shows count; invalidated on mark read / mark all read
- **Mark read:** Per-row "Mark read" button; "Mark all as read" in header
- **Links:** `buildNotificationUrl()` maps target_type/target_id/project_id to:
  - issue → `/dashboard/projects/{project_id}?tab=issues`
  - document → `/dashboard/projects/{project_id}?tab=documents`
  - report → `/dashboard/daily-reports/{id}`
  - task → `/dashboard/tasks/{id}`

---

## 6. Access and safety

- All API routes use `getTenantContextFromRequest` + `requireTenant`
- `listForUser`, `unreadCount`, `markRead`, `markAllRead` all filter by `tenant_id` and `user_id`
- User sees only own notifications; mark read enforces `.eq("user_id", userId)`
- Deep links use dashboard routes; access enforced by existing project/report/task permissions
- No cross-user or cross-tenant access

---

## 7. Validation

| Check              | Result                                      |
|--------------------|---------------------------------------------|
| contracts build    | ✅ OK                                       |
| tsc --noEmit       | ✅ OK                                       |
| next lint          | ✅ No ESLint warnings or errors             |
| lib/domain tests   | ✅ 93 passed (incl. 9 notification tests)   |
| Migration dry-run  | ✅ Would push migration 20260322500000      |

**Note:** Apply migration before use: `cd apps/web && supabase db push`

---

## 8. Non-goals confirmed

- Realtime websocket system
- Push notifications
- Email notifications
- Telegram / SMS
- Complex reminders scheduler
- User preference center
- Digest emails
- Mobile notifications
- Big dashboard redesign
- Major architecture rewrite

---

## 9. Final status

**DONE**

Notifications MVP is complete. Reminders are deferred.
