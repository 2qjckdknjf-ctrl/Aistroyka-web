# Mobile Uploads Runbook

Background upload flow: create session → upload binary to storage → finalize → attach to report. Retry-safe and idempotent.

## Flow

1. **Create session** — `POST /api/v1/media/upload-sessions`  
   Body: `{ "purpose": "project_media" }` (or other allowed purpose).  
   Response: `{ "data": { "id", "upload_path", ... } }`.  
   Lite: send `x-idempotency-key` (e.g. `create-<deviceId>-<requestId>`).

2. **Upload binary** — Client uploads file to Supabase Storage at the returned `upload_path` (or `upload_path` + filename).  
   Use the signed URL or direct bucket path per your Storage setup.  
   No API call for the binary itself; storage is tenant-scoped: `media/<tenantId>/<sessionId>` or `media/<tenantId>/<sessionId>/<filename>`.

3. **Finalize** — `POST /api/v1/media/upload-sessions/:id/finalize`  
   Body: `{ "object_path": "<storage path>", "mime_type": "image/jpeg", "size_bytes": 12345 }`.  
   **Rules:**
   - `object_path` must be within the session path: `media/<tenantId>/<sessionId>` or `media/<tenantId>/<sessionId>/<suffix>`.
   - No path traversal (`..`).
   - Same request (same idempotency key) returns same result; safe to retry.

4. **Attach to report** — `POST /api/v1/worker/report/add-media` with the finalized session id / object reference per API contract.

## Validation (server)

- Session must exist, belong to tenant and user.
- Status must be `created` or `uploaded` (or already `finalized` with same `object_path` for idempotency).
- Session must not be expired (`expires_at` >= now).
- `object_path` must match prefix `media/<tenantId>/<sessionId>`.

## Retry rules

- **Create**: Retry with same `x-idempotency-key`; duplicate creates are idempotent.
- **Finalize**: Retry with same `x-idempotency-key` and same body; duplicate finalize returns success.
- **Expired session**: If finalize returns "session expired", create a new session and re-upload.

## Reconciliation

An **upload_reconcile** job (scheduled) marks pending sessions (`created`/`uploaded`) with `expires_at` in the past as `expired`. No storage delete is performed. Clients should not rely on expired sessions; create a new one and retry.

## Env / config

- Session expiry: default 60 minutes (configurable in upload-session repository).
- Bucket: `media` (see `UPLOAD_BUCKET` in upload-session.service).

### Finalize verification (optional, env-gated)

- **MEDIA_FINALIZE_VERIFY_OBJECT** — `true` to verify the object exists in Supabase Storage before finalizing. Default `false`. When enabled and the object is missing, finalize returns **400** with `error: "media_object_missing"` and `code: "media_object_missing"`.
- **MEDIA_FINALIZE_VERIFY_STRICT** — When verification is on, `true` makes storage provider errors (e.g. timeout) block finalize with **503** `storage_verification_failed`. Default `false` (best-effort: on verification error, finalize still proceeds).
