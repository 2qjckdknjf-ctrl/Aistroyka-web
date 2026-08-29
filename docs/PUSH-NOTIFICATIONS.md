# Push notifications

## Overview

- **device_tokens:** `(tenant_id, user_id, device_id, platform ios|android, token)`. Register via `POST /api/v1/devices/register`; unregister via `POST /api/v1/devices/unregister`.
- **push_outbox:** Messages to send (`tenant_id`, `user_id`, `platform`, `type`, `payload`, status `queued|sent|failed`). Job handler `push_send` drains the outbox and calls APNs or FCM.

## Message types

Typed in `apps/web/lib/platform/push/push.types.ts`:

| Type | Typical source |
|------|----------------|
| `job_done` | Background job completion |
| `report_ready` | Worker report submitted / ready for review |
| `task_assigned` | Task assignment to a worker |
| `task_updated` | Task field updates relevant to assignees |
| `task_message` | New task-chat message (`createTaskMessage`) |

### `task_message` payload

Enqueued by `notifyTaskMessageRecipients` in
`apps/web/lib/domain/task-messages/task-messages.service.ts`:

- Alert: `title` (`"Task message"`), `body` (text preview or `"Voice message"` / `"Photo"` / `"Video"`).
- Flat keys + nested `data` for the provider data map: `type`, `task_id`,
  `project_id`, `message_id`, `kind`.
- Recipients: other assignees on the task (`worker_tasks.assigned_to` and
  `task_assignments`). Field-worker senders also create in-app manager
  notifications (`notifyProjectManagers` / `notifyTenantManagers`).

`buildPushDataMap` merges nested `data` with flat stringifiable keys and always
sets `type`. Clients read `userInfo.type` / `task_id` (iOS Manager deep-links
into task chat on `task_message`, `task_assigned`, or `task_updated`).

## When credentials not present

- Outbox and enqueue are implemented. Send is stubbed: APNs/FCM stubs return
  false / retryable when credentials are not configured.
- Configure `APNS_*` and/or FCM HTTP v1 (`FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`,
  `FCM_PRIVATE_KEY`) — see [`runbooks/PUSH_DELIVERY.md`](./runbooks/PUSH_DELIVERY.md).

## Admin

- `POST /api/v1/admin/push/test` enqueues a test push (admin only). Useful to
  verify outbox and (when credentials exist) delivery.
