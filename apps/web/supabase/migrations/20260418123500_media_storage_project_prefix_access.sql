-- Phase 2 runtime compatibility fix:
-- allow media object paths whose first folder segment is project_id,
-- when that project belongs to an accessible tenant.

drop policy if exists media_insert_tenant on storage.objects;
drop policy if exists media_select_tenant on storage.objects;

create policy media_insert_tenant on storage.objects
for insert to authenticated
with check (
  bucket_id = 'media'
  and (
    -- tenant-prefixed paths
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
    -- project-prefixed paths (legacy/current route compatibility)
    or (storage.foldername(name))[1] in (
      select projects.id::text
      from public.projects
      where projects.tenant_id in (
        select tenant_members.tenant_id
        from public.tenant_members
        where tenant_members.user_id = auth.uid()
      )
      or projects.tenant_id in (
        select tenants.id
        from public.tenants
        where tenants.user_id = auth.uid()
      )
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
    or (storage.foldername(name))[1] in (
      select projects.id::text
      from public.projects
      where projects.tenant_id in (
        select tenant_members.tenant_id
        from public.tenant_members
        where tenant_members.user_id = auth.uid()
      )
      or projects.tenant_id in (
        select tenants.id
        from public.tenants
        where tenants.user_id = auth.uid()
      )
    )
  )
);
