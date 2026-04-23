# Wave 4 Step 8 — Backend report (Stage B)

## Persistence

**Table:** `public.stakeholder_notifications` (see migration `apps/web/supabase/migrations/20260329170000_stakeholder_notifications.sql`).

**Fields (effective model):** `id`, `tenant_id`, `project_id`, `recipient_user_id` (nullable for invite-email-only rows), `recipient_email`, `kind`, `status`, `channel`, `payload` (JSON), `stakeholder_invite_id`, `client_request_id`, email timestamps, `read_at`, timestamps.

**Statuses:** `pending`, `delivered_in_app`, `email_sent`, `email_failed`, `email_skipped`, `read`.

**RLS:** Recipients update/read own rows; internal readers (`is_internal_tenant_reader_for_tenant`) select for manager audit; inserts via service role in emit paths.

## Repository

`apps/web/lib/domain/stakeholder-notifications/stakeholder-notifications.repository.ts`

- `insertNotification` / `updateNotification`
- `listForUser`, `unreadCount`, `markRead`
- `listDeliveryForProject` (manager audit)
- `hasRecentReminderForRequest`, `hasRecentInviteReminder` (idempotency)

## Emission

`stakeholder-notifications.emit.ts` — uses **admin** Supabase client for inserts + email.

## New / updated API routes

| Route | Role |
|-------|------|
| `GET /api/v1/projects/:id/stakeholder-notifications` | Portal cohort (`canStakeholderAccessClientRequests`) — public JSON via `rowToPublic`. |
| `POST /api/v1/projects/:id/stakeholder-notifications/:notificationId/read` | Same cohort — mark read. |
| `GET /api/v1/projects/:id/stakeholder-delivery` | `canManageProjectStakeholders` — delivery audit list. |

## Wired call sites (triggers)

- `POST .../stakeholders` → `emitStakeholderInviteSent`
- `POST .../stakeholders/:id` with `action: "resend_invite"` → `emitStakeholderInviteSent`
- `POST .../client-requests` → `emitClientRequestCreatedForStakeholders`
- `POST .../client-requests/:id/respond` → `notifyProjectManagers` (admin)
- `POST .../stakeholder-invites/accept` → `notifyProjectManagers` (admin)
- `POST .../admin/jobs/cron-tick` → `runStakeholderNotificationReminders`

## Auth / tenant

All routes use `getTenantContextFromRequest` + existing policies; emissions use `getAdminClient()` only after user-authorized actions or cron secret.

## Risks

- Email depends on env configuration; failed email still records `email_failed`.
- Manager notifications require admin client for stakeholder-initiated events (RLS on `manager_notifications`).
