# Storage and media readiness

## Upload flow (code path)

1. **Create session:** POST /api/v1/media/upload-sessions → upload_sessions row (tenant_id, user_id, purpose); returns `upload_path`: `media/{tenantId}/{sessionId}`.
2. **Client upload:** Client uploads file to Supabase Storage at path `{tenantId}/{sessionId}` (or with subpath) in bucket **media** using signed URL or anon key with RLS.
3. **Finalize:** POST /api/v1/media/upload-sessions/[id]/finalize with object_path, mime_type, size_bytes → repo.finalize updates session, links to media/report as needed. Path validated: must be within `media/{tenantId}/{sessionId}` (no `..`).

## Bucket and paths

| Item | Value |
|------|--------|
| Bucket name | **media** (UPLOAD_BUCKET in upload-session.service) |
| Path pattern | `{tenantId}/{sessionId}` or `{tenantId}/{sessionId}/filename` |
| Tenant scoping | Path prefix includes tenant_id; RLS/policies must restrict by tenant. |

## Validation checklist (staging/prod)

1. **Bucket exists:** Supabase Dashboard → Storage → bucket **media** exists.
2. **Upload session create:** As tenant user, create upload session; response includes upload_path.
3. **Upload to storage:** Client uploads to the returned path in bucket media (using Supabase client with session or signed URL).
4. **Finalize:** POST finalize with object_path matching session; expect 200.
5. **Read access:** Authorized user (same tenant) can read object; unauthorized (other tenant) cannot.
6. **Path traversal:** Finalize with object_path containing `..` or outside tenant/session → 400.

## Optional env

- **MEDIA_FINALIZE_VERIFY_OBJECT=true** — Before finalize, check object exists in storage (best-effort).
- **MEDIA_FINALIZE_VERIFY_STRICT=true** — When verify enabled, fail finalize if storage check fails.

## AI image URLs

- **AI_TRUSTED_IMAGE_HOSTS** — Comma-separated hosts for image URLs when PII/strict mode. Empty = allow all. Used in policy.service (checkPiiImageUrl). Tighten for production if needed.
