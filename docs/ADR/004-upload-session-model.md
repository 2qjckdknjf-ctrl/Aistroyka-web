# ADR-004: Upload session model

**Status:** Accepted  
**Context:** Mobile clients need a way to upload media without sending large bodies through the API; resumable upload is out of scope for Phase 1.

**Decision:** Introduce `upload_sessions` table: id, tenant_id, user_id, purpose, status (created|uploaded|finalized|expired), object_path, mime_type, size_bytes, created_at, expires_at. Flow: (1) POST create session → return session id and upload_path; (2) client uploads file to Supabase Storage at that path (client Supabase with JWT); (3) POST finalize with object_path (and optional mime_type, size_bytes). Only the session owner can finalize; session must not be expired.

**Consequences:** Server does not handle file bytes; mobile can use SDK upload. No signed URL generated server-side in Phase 1 (client uses own Supabase client). Policy: worker can only finalize their own session.
