# Phase 3 — Supabase Storage Production Setup

**Goal:** Media upload and access work correctly in production with tenant isolation.

---

## Expected bucket

- **Bucket name:** `media`
- **Usage:** Upload sessions write under `media/{tenant_id}/{session_id}/` (and optional subpaths). App uses `UPLOAD_BUCKET = "media"` (upload-session.service.ts, resolve-image-url.ts).

---

## Who can upload / read

- **Upload:** Authenticated users who are tenant members and have project/session context upload via **signed URL** or server-handled path. The app creates upload_session and returns path `media/{tenant_id}/{session_id}`; client uploads to Supabase Storage using anon key and RLS/policies. So Storage must allow **authenticated** (or anon with strict policy) to insert into `media` within their tenant path.
- **Read:** Anyone with the object path (signed or public URL) can read if policy allows. For tenant isolation, allow **select** only for paths that belong to the user’s tenant(s). Typically: allow `authenticated` to select where `bucket_id = 'media'` and path matches tenant (e.g. (storage.foldername(name))[1] = tenant_id from tenant_members).

---

## Tenant isolation rules

- Path structure: `media/{tenant_id}/{session_id}[/file]`. Enforce that:
  - **INSERT:** Only allow insert under `media/{tenant_id}/` when `tenant_id` is in the user’s tenants (tenant_members).
  - **SELECT:** Only allow select when the first path segment after `media/` equals a tenant_id the user is a member of.
- Use Supabase Storage policies on `storage.objects` (and optionally `storage.buckets`).

---

## SQL policies (Supabase Storage)

Run in **Supabase Dashboard → SQL Editor** (or via migration). Supabase uses `storage.buckets` and `storage.objects`; policies reference `auth.uid()` and `(storage.foldername(name))[1]` for the first folder (tenant_id).

**1. Create bucket (if not exists):**

```sql
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;
```

**2. Allow authenticated users to upload only under their tenant folder:**

```sql
create policy "media_insert_tenant"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'media'
  and (storage.foldername(name))[1] in (
    select tenant_id::text from public.tenant_members where user_id = auth.uid()
  )
);
```

**3. Allow authenticated users to read only their tenants’ objects:**

```sql
create policy "media_select_tenant"
on storage.objects for select
to authenticated
using (
  bucket_id = 'media'
  and (storage.foldername(name))[1] in (
    select tenant_id::text from public.tenant_members where user_id = auth.uid()
  )
);
```

**4. Service role (backend) needs full access for job processor and finalize verification.** If your app uses service_role for some storage calls (e.g. list for verify), ensure service_role bypasses RLS or add a policy for service_role. Supabase typically allows service_role to bypass RLS. If you use anon key for upload from client, you may need an **anon** policy that allows insert only with a signed URL or a token that encodes tenant_id; the exact pattern depends on whether the client uploads with anon or authenticated. For **authenticated** uploads from the web app (session cookie), the two policies above suffice.

**5. Optional — allow public read for public URLs:** If you serve media via public URLs (e.g. `getPublicUrl`), you can either keep the bucket private and use signed URLs only, or add a policy that allows public read for `bucket_id = 'media'`. For tenant isolation with public read, you cannot restrict by auth; use signed URLs for tenant-isolated reads instead.

**Recommended:** Keep bucket **private**; use signed URLs for read. Then the two policies (insert_tenant, select_tenant) are enough for authenticated clients; service_role (admin client) bypasses RLS for server-side verify/list.

---

## Dashboard step-by-step

1. **Supabase Dashboard** → **Storage**.
2. If bucket `media` does not exist: **New bucket** → Name: `media`, **Private** → Create.
3. **Policies** → **New policy** on `storage.objects` (or use SQL above).
   - Policy 1: Insert, name “media_insert_tenant”, with check as above.
   - Policy 2: Select, name “media_select_tenant”, using expression as above.
4. Save. If you use a migration file instead, run the migration and then confirm in Dashboard that the bucket and policies exist.

---

## Verification

**1. Upload test (authenticated):**

- Log in to the app, create or open a project, create an upload session (e.g. add media to a report).
- Upload a small file to the path returned (e.g. `media/{tenant_id}/{session_id}/file.jpg`).
- **Expected:** Upload succeeds; object appears in Storage under `media/{tenant_id}/{session_id}/`.

**2. Access allowed:**

- As the same user, open or refresh the report/media view that should show the file (signed URL or embedded).
- **Expected:** Image or file is visible (no 403).

**3. Cross-tenant blocked:**

- Using the same object path, try to access it with a different user who is in another tenant (e.g. different browser or API request with another user’s JWT).
- **Expected:** 403 or “not found” when using authenticated select policy; signed URLs are tenant-scoped so a user from another tenant should not receive a signed URL for another tenant’s object.

---

## Quick SQL block (all-in-one)

```sql
-- Create bucket
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

-- Policies (drop if re-running)
drop policy if exists "media_insert_tenant" on storage.objects;
drop policy if exists "media_select_tenant" on storage.objects;

create policy "media_insert_tenant"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'media'
  and (storage.foldername(name))[1] in (
    select tenant_id::text from public.tenant_members where user_id = auth.uid()
  )
);

create policy "media_select_tenant"
on storage.objects for select to authenticated
using (
  bucket_id = 'media'
  and (storage.foldername(name))[1] in (
    select tenant_id::text from public.tenant_members where user_id = auth.uid()
  )
);
```
