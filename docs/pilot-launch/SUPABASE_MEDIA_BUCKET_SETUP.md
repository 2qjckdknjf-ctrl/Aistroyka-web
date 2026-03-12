# Supabase media bucket setup — ready-to-paste

**Bucket name:** `media`  
**Path pattern:** `{tenant_id}/{session_id}/...` (tenant_id = first path segment).

---

## Step 1: Create bucket (Dashboard)

1. Supabase Dashboard → **Storage** → **New bucket**.
2. Name: **media**.
3. **Public** or **Private:** Choose Private for tenant-scoped read (recommended). If Public, SELECT policy still restricts by tenant; INSERT must remain restricted.
4. Create.

---

## Step 2: Policies on `storage.objects`

Storage RLS applies to the `storage.objects` table. Bucket is identified by `bucket_id = 'media'`. Path is in `name` (e.g. `tenant-uuid/session-uuid/file.jpg`). Use `(storage.foldername(name))[1]` for first segment (tenant_id).

**Run in SQL Editor (Supabase Dashboard → SQL Editor) or use Policy UI with equivalent expression.**

### Policy 1: INSERT (upload) — tenant-scoped

Only allow insert if the first path segment (tenant_id) is a tenant the user belongs to.

```sql
-- Policy name: media_insert_tenant_scoped
-- Allowed operation: INSERT
-- Target: bucket_id = 'media'

CREATE POLICY "media_insert_tenant_scoped"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM public.tenant_members WHERE user_id = auth.uid()
  )
);
```

### Policy 2: SELECT (read) — tenant-scoped

Only allow select if the first path segment is a tenant the user belongs to.

```sql
-- Policy name: media_select_tenant_scoped
-- Allowed operation: SELECT
-- Target: bucket_id = 'media'

CREATE POLICY "media_select_tenant_scoped"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM public.tenant_members WHERE user_id = auth.uid()
  )
);
```

### Policy 3: UPDATE / DELETE (optional)

Same tenant check for update/delete if your app allows edits/deletes.

```sql
CREATE POLICY "media_update_tenant_scoped"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM public.tenant_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "media_delete_tenant_scoped"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM public.tenant_members WHERE user_id = auth.uid()
  )
);
```

---

## If policies already exist

If you see "policy already exists", drop first:

```sql
DROP POLICY IF EXISTS "media_insert_tenant_scoped" ON storage.objects;
DROP POLICY IF EXISTS "media_select_tenant_scoped" ON storage.objects;
DROP POLICY IF EXISTS "media_update_tenant_scoped" ON storage.objects;
DROP POLICY IF EXISTS "media_delete_tenant_scoped" ON storage.objects;
```

Then run the CREATE POLICY statements above.

---

## Verification

1. As user A (tenant T1): Upload to path `T1_UUID/session_uuid/test.jpg` in bucket `media` → success.
2. As user A: Read object at that path → success.
3. As user B (tenant T2): Read object at `T1_UUID/session_uuid/test.jpg` → fail (403).
4. As user B: Insert to path `T2_UUID/session_uuid/test2.jpg` → success.
