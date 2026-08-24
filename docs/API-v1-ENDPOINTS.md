# API v1 Endpoints and Contracts

<!-- markdownlint-disable MD060 -->

Base path: `/api/v1`. All endpoints that require auth use TenantContext (JWT + tenant membership). Errors return JSON with `error` (and optional `code`).

---

## Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/health` | No | Readiness; same contract as `/api/health`; validated with HealthResponseSchema. |

---

## Auth

Canonical `/api/v1/auth/*` handlers re-export `/api/auth/*` where noted. Cookie session (`sb-*`) for web. See `docs/auth/PASSWORD_RECOVERY.md` and `docs/auth/MULTI_PROVIDER_AUTH_INVENTORY.md`.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/login` | No | Email/password cookie login. Body: `{ email, password, traceId? }`. Success `{ ok: true }` + `Set-Cookie`. Rate-limited **5/min/IP** when admin client exists. 400 missing fields; 429 limited; 503 missing Supabase env. Re-export of `/api/auth/login`. |
| POST | `/api/v1/auth/forgot-password` | No | Request reset email. Body: `{ email, locale? }` (`en`/`ru`/`es`/`it`). Valid email + Supabase accept → `{ ok: true }` (does not prove the mailbox exists). Rate-limited **10/min/IP**. 400 invalid email; 429; 500 Supabase error; 503 missing env. Re-export of `/api/auth/forgot-password`. |
| POST | `/api/v1/auth/reset-password` | Recovery session | Set new password. Body: `{ password, confirmPassword }` (min 8, must match). Calls `updateUser` then `signOut`. 401 invalid/expired link; 400 validation or Supabase update error. Re-export of `/api/auth/reset-password`. |
| GET | `/api/v1/auth/methods` | Yes | Linked methods `{ methods: { email, apple, telegram }, linkedCount }`. |
| POST | `/api/v1/auth/methods` | Yes | Unlink `apple` or `telegram`. Body: `{ action: "unlink", provider }`. Rejects last remaining method (`last_method_forbidden`). |

Related (not under `/api/v1`): `GET /api/auth/callback` (OAuth + `recovery=1`), `GET /api/auth/diag` (`docs/AUTH_DIAG.md`).

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
- **403 Forbidden:** Insufficient role or not your resource.
- **402 Payment Required:** AI quota exceeded for the period (`code: "quota_exceeded"`).
- **429 Too Many Requests:** Rate limit exceeded.
- **400 Bad Request:** Invalid body or missing required fields.

Error payload: `{ "error": string, "code"?: string }`. Optional `traceId` in logging (not always in response body).

<!-- markdownlint-enable MD060 -->
