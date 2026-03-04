# API v1 Endpoints and Contracts

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
| POST | `/api/v1/media/upload-sessions` | `{ "purpose"?: "report_before" \| "report_after" \| "project_media" }` | `{ "data": UploadSession & { upload_path } }` |
| POST | `/api/v1/media/upload-sessions/:id/finalize` | `{ "object_path": string, "mime_type"?, "size_bytes"? }` | `{ "ok": true }` |

---

## Worker (base)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/worker` | 501 stub. |
| POST | `/api/v1/worker` | 501 stub. |

---

## Error responses

- **401 Unauthorized:** Missing or invalid auth; or no tenant membership.
- **403 Forbidden:** Insufficient role or not your resource.
- **402 Payment Required:** AI quota exceeded for the period (`code: "quota_exceeded"`).
- **429 Too Many Requests:** Rate limit exceeded.
- **400 Bad Request:** Invalid body or missing required fields.

Error payload: `{ "error": string, "code"?: string }`. Optional `traceId` in logging (not always in response body).
