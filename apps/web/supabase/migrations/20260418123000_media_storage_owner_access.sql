-- Phase 2 runtime fix: allow tenant owners (tenants.user_id) to upload/select media bucket objects.
-- Existing policy allowed only tenant_members entries, which blocks owners not mirrored in tenant_members.

drop policy if exists media_insert_tenant on storage.objects;
drop policy if exists media_select_tenant on storage.objects;

create policy media_insert_tenant on storage.objects
for insert to authenticated
with check (
  bucket_id = 'media'
  and (
    (storage.foldername(name))[1] in (
      select tenant_members.tenant_id::text
      from public.tenant_members
      where tenant_members.user_id = auth.uid()
    )
    or (storage.foldername(name))[1] in (
      select tenants.id::text
      from public.tenants
      where tenants.user_id = auth.uid()
    )
  )
);

create policy media_select_tenant on storage.objects
for select to authenticated
using (
  bucket_id = 'media'
  and (
    (storage.foldername(name))[1] in (
      select tenant_members.tenant_id::text
      from public.tenant_members
      where tenant_members.user_id = auth.uid()
    )
    or (storage.foldername(name))[1] in (
      select tenants.id::text
      from public.tenants
      where tenants.user_id = auth.uid()
    )
  )
);
