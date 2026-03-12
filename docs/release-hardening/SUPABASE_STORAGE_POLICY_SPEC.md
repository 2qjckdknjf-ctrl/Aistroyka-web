# Supabase storage policy spec

**Bucket:** `media`  
**Purpose:** Tenant-scoped media uploads; path prefix `{tenant_id}/{session_id}/...`.

## Required policies (implement in Supabase Dashboard → Storage → media → Policies)

### 1. INSERT (upload)

- **Policy name:** e.g. `media_insert_tenant_scoped`
- **Allowed:** Authenticated users who are members of the tenant that owns the path.
- **Check:** Path must start with a tenant_id that the user belongs to (tenant_members). In Supabase RLS terms: `(storage.foldername(name))[1]` is the tenant_id; require `(storage.foldername(name))[1] IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())`.
- **Note:** Supabase storage RLS uses `bucket_id` and `name` (object path). So for path `{tenant_id}/{session_id}/file.jpg`, first segment is tenant_id.

### 2. SELECT (read)

- **Policy name:** e.g. `media_select_tenant_scoped`
- **Allowed:** Users who are members of the tenant for that path.
- **Using:** `(storage.foldername(name))[1] IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())`.

### 3. UPDATE / DELETE

- Apply same tenant check as SELECT if you allow update/delete; or restrict to uploader (second segment = session, match upload_sessions.user_id). Minimal: same as SELECT for tenant-scoped delete.

## Service role

- Server-side operations (e.g. upload_reconcile, finalize verification with getAdminClient()) use service role and bypass RLS. Ensure server only writes paths that match tenant/session from DB.

## Step-by-step (Dashboard)

1. Storage → Create bucket **media** if not exists (public or private per your design; private recommended).
2. Policies → New policy → For bucket **media**.
3. INSERT: Expression using `storage.foldername(name)` and `tenant_members` as above.
4. SELECT: Same expression.
5. Test: As user A (tenant T1), upload to T1/session-id/file.jpg → success. As user B (tenant T2), read T1/session-id/file.jpg → deny.

## CONFIG-REQUIRED

Policies are created in Supabase Dashboard (or via Supabase CLI/migrations if your project uses storage migrations). This repo does not contain storage policy SQL; create per spec above and validate with staging/prod checklist in STORAGE_AND_MEDIA_READINESS.md.
