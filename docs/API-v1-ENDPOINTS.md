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

## Field daily log (contractor-ops)

Per-project site log: **draft → human confirm**. Not the Phase 7 daily digest and not `POST /api/v1/ai/analyze-video-daily`. Runbook: [FIELD_DAILY_LOG.md](./runbooks/FIELD_DAILY_LOG.md).

Auth: tenant JWT + `canReadProjects` (viewer+). Portal stakeholders → **403**. Lite/worker `x-client` → **403** (`lite_client_path_forbidden`).

| Method | Endpoint | Body / query | Response |
|--------|----------|--------------|----------|
| GET | `/api/v1/projects/:id/field-daily-logs` | `work_date?`, `status?`, `limit?` (default 50, max 100) | `{ "data": FieldDailyLog[] }` |
| POST | `/api/v1/projects/:id/field-daily-logs` | `{ "work_date": "YYYY-MM-DD", "note?", "summary?", "work_done?", "blockers?", "weather?", "media_refs?" }` — at least one text field or `media_refs` | `{ "data": FieldDailyLog }` **201** |
| GET | `/api/v1/projects/:id/field-daily-logs/:logId` | — | `{ "data": FieldDailyLog }` |
| PATCH | `/api/v1/projects/:id/field-daily-logs/:logId` | same fields as create (all optional). Empty body returns the current row. Draft only. | `{ "data": FieldDailyLog }` |
| POST | `/api/v1/projects/:id/field-daily-logs/:logId/confirm` | — | `{ "data": FieldDailyLog }` with `status=confirmed`, `confirmed_by`, `confirmed_at` |

`FieldDailyLog.status` is `draft` \| `confirmed`. Edit or confirm after confirm → **409** (`Only draft logs can be edited` / `Only draft logs can be confirmed`). No delete route. `media_refs` are opaque strings (not validated against upload sessions).

---

## Copilot chat threads

Same-origin replacement for the undeployed Edge Function `/functions/v1/aistroyka-ai-chat`. Evidence: [RELEASE_HARDENING_COPILOT_THREAD_API_2026-09-06.md](./reports/RELEASE_HARDENING_COPILOT_THREAD_API_2026-09-06.md). Code: `apps/web/lib/copilot/chat-history.service.ts`.

Auth: tenant JWT + project access (`getProject`). Threads are scoped to **tenant + project + `created_by` (caller)**. Lite/worker clients are **403** (copilot is not on the lite allow-list). List returns **active** threads only.

| Method | Endpoint | Body / query | Response |
|--------|----------|--------------|----------|
| GET | `/api/v1/projects/:id/copilot/chat/threads` | `limit?` (default 20, max 50) | `{ "data": CopilotThread[] }` |
| POST | `/api/v1/projects/:id/copilot/chat/threads` | `{ "title"?: string }` (trimmed, max 160) | `{ "data": CopilotThread }` **201** |
| GET | `/api/v1/projects/:id/copilot/chat/threads/:threadId` | `messages_limit?` (default 50, max 200) | `{ "data": { "thread", "messages" } }` — messages chronological; `low_confidence` is always `false` (column not in live schema) |
| PATCH | `/api/v1/projects/:id/copilot/chat/threads/:threadId` | `{ "status": "archived" }` only | `{ "ok": true }` |

Do not call `/functions/v1/aistroyka-ai-chat` for thread CRUD. Send uses `POST /api/v1/projects/:id/copilot/chat/stream`. Archive is not delete. List/create/load failures that are not 404 typically return **503**.

---

## AI

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/ai/analyze-image` | Optional | Analyze construction image. Body: `{ "image_url": string, "media_id?", "project_id?" }`. Rate-limited and quota-checked when tenant present. 402 on quota exceeded, 429 on rate limit. |
| POST | `/api/v1/ai/analyze-video-daily` | Optional | One-shot Gemini video → structured “work done for the day”. Body: `{ "video_url": string, "work_date?", "media_id?", "project_id?" }`. Requires `GOOGLE_AI_API_KEY` or `GEMINI_API_KEY` (503 if unset). Does **not** write `field_daily_logs`. Rate-limited / quota-checked when tenant present. |

Contracts: `AnalyzeImageRequestSchema`, `AnalysisResultSchema`, `AnalyzeImageErrorSchema`; `AnalyzeVideoDailyRequestSchema`, `DailyWorkVideoAnalysisSchema`.

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

| Method | Endpoint                                         | Body                                                              | Response                                    |
| ------ | ------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------- |
| POST   | `/api/v1/media/upload-sessions`                  | `{ "purpose"?: "report_before" \| "report_after" \| "project_media" }` | `{ "data": UploadSession & { upload_path } }` |
| POST   | `/api/v1/media/upload-sessions/:id/finalize`     | `{ "object_path": string, "mime_type"?, "size_bytes"? }`           | `{ "ok": true }`                            |

---

## Worker (base)

| Method | Endpoint          | Description   |
|--------|-------------------|---------------|
| GET    | `/api/v1/worker`  | 501 stub.     |
| POST   | `/api/v1/worker`  | 501 stub.     |

---

## Error responses

- **401 Unauthorized:** Missing or invalid auth; or no tenant membership.
- **403 Forbidden:** Insufficient role, portal-only stakeholder, or lite-client path (`code: "lite_client_path_forbidden"`).
- **402 Payment Required:** AI quota exceeded for the period (`code: "quota_exceeded"`).
- **409 Conflict:** Resource not in an editable state (e.g. confirm/edit a confirmed field daily log).
- **429 Too Many Requests:** Rate limit exceeded.
- **400 Bad Request:** Invalid body or missing required fields.

Error payload: `{ "error": string, "code"?: string }`. Optional `traceId` in logging (not always in response body).

<!-- markdownlint-enable MD060 -->
