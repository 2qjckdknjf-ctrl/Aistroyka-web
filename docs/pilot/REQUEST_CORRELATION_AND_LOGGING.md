# Request Correlation and Structured Logging

**Phase 6 — Pilot Deployment & Observability**

---

## Goal

- Every important backend request/action can be traced.
- Client and server logs can be correlated.
- Tenant-safe, role-safe context is visible in logs.
- Secrets and tokens are never logged.

---

## Backend

### Request ID propagation

- **Source:** `x-request-id` request header (client may send) or server-generated UUID.
- **Helpers:** `getOrCreateRequestId(request)`, `addRequestIdToResponse(response, requestId)` in `@/lib/observability`.
- **Usage:** Critical API routes use `withRequestIdAndTiming(request, response, opts)`, which:
  - Gets or creates a request ID from the request.
  - Sets `x-request-id` on the response.
  - Logs a structured `request_finished` event with request_id, route, method, status, duration_ms, tenantId, userId.

### Routes instrumented with request_id + timing

- `POST /api/v1/worker/report/submit`
- `POST /api/v1/tasks/:id/assign`
- `GET /api/v1/notifications`
- `POST /api/v1/sync/ack`, `GET /api/v1/sync/changes`
- `POST /api/v1/media/upload-sessions`, `POST /api/v1/media/upload-sessions/:id/finalize`
- `POST /api/v1/jobs/process`
- `GET /api/v1/ops/overview`, `GET /api/v1/ops/metrics`
- `POST /api/ai/analyze-image`, `POST /api/analysis/process`
- `POST /api/auth/login`

New or other critical routes should call `withRequestIdAndTiming` on every response path.

### Structured log format

- **Event:** `request_finished` (and other events such as `auth_login`, `sync_conflict`, etc.).
- **Fields (typical):** `event`, `request_id`, `route`, `method`, `status`, `duration_ms`, `tenantId`, `userId`, `ts` (ISO).
- **Logger:** `logStructured()` in `@/lib/observability`; redacts keys containing token/secret/password; no raw bearer or body dumping.

### What is not logged

- Raw `Authorization` or bearer tokens.
- Full request/response bodies.
- PII beyond tenant_id / user_id where already used for context.

---

## Mobile / Web clients

- **Send:** Clients should send `x-request-id` (UUID) on important requests so server uses it and returns the same id in `x-request-id` response header.
- **Capture:** When a response includes `x-request-id`, clients should capture it (e.g. for display in diagnostics or when reporting an error).
- **Diagnostics:** Diagnostics screens may show the last or a relevant request_id so support can correlate with backend logs.

---

## Correlation flow

1. Client (optional) generates UUID and sets `x-request-id` on request.
2. Server uses that id or generates one; resolves tenant/user; runs handler.
3. Server returns response with `x-request-id` set (on instrumented routes) and logs `request_finished` with that id, route, status, duration, tenant_id, user_id.
4. Client can read `x-request-id` from response and show it in diagnostics or error reporting.
5. Support uses request_id to search backend logs and trace the request.

---

## Implementation status

- **Done:** Trace helpers, structured logger, redaction, `withRequestIdAndTiming` on sync, upload, jobs, auth, AI, ops, report submit, task assign, notifications.
- **Documented:** Client send/capture and diagnostics usage above.
- **Pending:** Apply `withRequestIdAndTiming` to remaining high-traffic or pilot-critical v1 routes as needed.
