# API v1 Endpoints and Contracts

<!-- markdownlint-disable MD060 -->

Base path: `/api/v1`. All endpoints that require auth use TenantContext (JWT + tenant membership). Errors return JSON with `error` (and optional `code`).

---

## Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/health` | No | Readiness; same contract as `/api/health`; validated with HealthResponseSchema. |

---

## Projects

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/projects` | Yes | List projects for current tenant. |
| POST | `/api/v1/projects` | Yes | Create project. Body: `{ "name": string }`. |

Contracts: `CreateProjectRequestSchema`, `ProjectsListResponseSchema` (see `@aistroyka/contracts`).

---

## AI

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/ai/analyze-image` | Optional | Analyze construction image. Body: `{ "image_url": string, "media_id?", "project_id?" }`. Rate-limited and quota-checked when tenant present. 402 on quota exceeded, 429 on rate limit. |

Contracts: `AnalyzeImageRequestSchema`, `AnalysisResultSchema`, `AnalyzeImageErrorSchema`.

---

## Worker Lite

All require auth and at least member role for write; viewer for GET tasks/today.

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/v1/worker/tasks/today` | — | `{ "data": Task[] }` |
| POST | `/api/v1/worker/day/start` | — | `{ "data": WorkerDay }` |
| POST | `/api/v1/worker/day/end` | — | `{ "data": WorkerDay }` |
| POST | `/api/v1/worker/report/create` | `{ "day_id"?: string }` | `{ "data": Report }` |
| POST | `/api/v1/worker/report/add-media` | `{ "report_id": string, "media_id"?: string, "upload_session_id"?: string }` | `{ "ok": true }` |
| POST | `/api/v1/worker/report/submit` | `{ "report_id": string }` | `{ "ok": true }` |

---

## Media (upload sessions)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/v1/media/upload-sessions` | `{ "purpose"?: "report_before" \| "report_after" \| "project_media" \| "task_chat" }` | `{ "data": UploadSession & { upload_path } }` |
| POST | `/api/v1/media/upload-sessions/:id/finalize` | `{ "object_path": string, "mime_type"?, "size_bytes"? }` | `{ "ok": true }` |

For `task_chat`, both `mime_type` and a positive integer `size_bytes` are
required when finalizing. The object path must remain under the session's
returned `upload_path`; the session must belong to the current user.

---

## Task chat

Task chat is scoped to a task and supports text, voice, image, and video
messages between managers and assigned workers.

| Method | Endpoint | Body / query | Response |
|--------|----------|--------------|----------|
| GET | `/api/v1/tasks/:id/messages` | Query: `limit` (default 50, max 100), `cursor` | `{ "data": TaskMessage[], "nextCursor": string \| null }` |
| POST | `/api/v1/tasks/:id/messages` | `CreateTaskMessage` (below) | `{ "data": TaskMessage }` (`201` created; `200` client replay) |
| DELETE | `/api/v1/tasks/:id/messages/:messageId` | — | `{ "ok": true }` (soft-delete) |

Pages are ordered oldest first. Pass the opaque `nextCursor` from one response
as the next request's `cursor`; clients must not construct or parse cursors.

### Create a message

The API accepts camelCase or snake_case for the media, duration, and client ID
fields:

```json
{
  "kind": "text | voice | image | video",
  "body": "Text body or optional media caption",
  "mediaId": "finalized upload-session UUID",
  "durationMs": 42000,
  "clientId": "client-generated deduplication key"
}
```

- `text` requires a non-empty `body` and does not use `mediaId`.
- `voice`, `image`, and `video` require `mediaId`. It must identify a finalized
  `task_chat` upload session created by the current user.
- `durationMs` is optional and used only for voice messages.
- `clientId` is optional. Reusing it for the same tenant, task, and sender
  returns the existing message with HTTP `200` instead of inserting again.
- `POST` also supports `x-idempotency-key` for route-level replay protection.

Example text request:

```http
POST /api/v1/tasks/7d5c/messages
Content-Type: application/json
X-Idempotency-Key: task-chat-7d5c-0001

{
  "kind": "text",
  "body": "Rebar inspection is complete.",
  "clientId": "ios-01J2ABC"
}
```

`TaskMessage` uses snake_case and includes:

```text
id, tenant_id, project_id, task_id, sender_user_id, kind, body,
upload_session_id, duration_ms, client_id, created_at, edited_at, deleted_at,
mime_type, object_path, size_bytes, media_url
```

Media metadata is joined from the upload session. `media_url` is a best-effort
signed URL with a one-hour lifetime; re-list messages to obtain a fresh URL.

### Attach media

1. Create an upload session with
   `POST /api/v1/media/upload-sessions` and `{ "purpose": "task_chat" }`.
2. Upload the bytes to the returned `upload_path` in the `media` bucket.
3. Finalize the session with `object_path`, `mime_type`, and the actual positive
   `size_bytes`.
4. Create the message with a matching `kind` and the session ID as `mediaId`.

| Kind | Maximum | Allowed MIME types | Additional constraint |
|------|---------|--------------------|-----------------------|
| `image` | 15 MiB | `image/jpeg`, `image/png`, `image/jpg` | — |
| `voice` | 5 MiB | `audio/m4a`, `audio/mp4`, `audio/x-m4a`, `audio/aac` | `durationMs` must be at most 120,000 when supplied |
| `video` | 50 MiB | `video/mp4`, `video/quicktime` | — |

The message create call fails closed when media metadata is absent or does not
match the message kind. Relevant error codes are `media_invalid`,
`media_purpose`, `media_mime`, `media_size`, and `media_duration`.

### Access and deletion

- Non-lite callers with task-management permission (`owner`, `admin`, or
  `member`) may access chat for tasks in their tenant.
- Field-worker clients identified by `x-client: ios_lite`, `android_lite`,
  `ios_worker`, or `android_worker` must be assigned through
  `worker_tasks.assigned_to` or `task_assignments`. A `member` role does not
  bypass this assignment check for a field-worker client.
- A tenant `viewer` has no tenant-wide manager access; an assigned worker can
  access the assigned task through the assignment rule.
- Senders may soft-delete their own messages. Non-lite callers with
  task-management permission may soft-delete any message in the task.
  Already-deleted messages return success, and deleted rows are omitted from
  subsequent lists.
- The task-message and upload-session paths are present in the field-worker
  API allow-list. Other `/api/v1` paths still return
  `403` / `lite_client_path_forbidden` for those clients.

Web clients can subscribe to `public.task_messages` Realtime changes; mobile
clients should use this API's cursor pagination or polling. Task messages are
not returned by the mobile sync/bootstrap payload.

Implementation references:

- Routes: `apps/web/app/api/v1/tasks/[id]/messages/`
- Domain rules: `apps/web/lib/domain/task-messages/`
- RLS and Realtime:
  `apps/web/supabase/migrations/20260718120000_task_messages.sql` and
  `20260718123000_task_messages_rls_manager_roles.sql`
- Client workflow: [`mobile-ios/TASK_CHAT_FEATURE_NOTE.md`](./mobile-ios/TASK_CHAT_FEATURE_NOTE.md)

---

## Worker (base)

| Method | Endpoint          | Description   |
|--------|-------------------|---------------|
| GET    | `/api/v1/worker`  | 501 stub.     |
| POST   | `/api/v1/worker`  | 501 stub.     |

---

## Error responses

- **401 Unauthorized:** Missing or invalid auth; or no tenant membership.
- **403 Forbidden:** Insufficient role or not your resource.
- **402 Payment Required:** AI quota exceeded for the period (`code: "quota_exceeded"`).
- **429 Too Many Requests:** Rate limit exceeded.
- **400 Bad Request:** Invalid body or missing required fields.

Error payload: `{ "error": string, "code"?: string }`. Optional `traceId` in logging (not always in response body).

<!-- markdownlint-enable MD060 -->
