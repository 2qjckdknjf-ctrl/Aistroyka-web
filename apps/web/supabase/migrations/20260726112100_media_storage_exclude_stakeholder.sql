-- Media storage policies keyed off tenant_members without a role filter, so
-- portal stakeholders (tenant_members.role = 'stakeholder') could list/download
-- every object under media/{tenantId}/… and media/{anyProjectId}/… for the
-- whole tenant — far beyond project-scoped portal visibility.
--
-- Internal roles keep tenant/project-prefix access. Active project stakeholders
-- may only touch project-prefixed paths for projects they are assigned to.

drop policy if exists media_insert_tenant on storage.objects;
drop policy if exists media_select_tenant on storage.objects;

create policy media_insert_tenant on storage.objects
for insert to authenticated
with check (
  bucket_id = 'media'
  and (
    -- tenant-prefixed paths: internal workspace only
    (storage.foldername(name))[1] in (
      select tm.tenant_id::text
      from public.tenant_members tm
      where tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'member', 'viewer')
    )
    or (storage.foldername(name))[1] in (
      select t.id::text
      from public.tenants t
      where t.user_id = (select auth.uid())
    )
    -- project-prefixed paths: internal tenant members, or active stakeholder on that project
    or (storage.foldername(name))[1] in (
      select p.id::text
      from public.projects p
      where p.tenant_id in (
        select tm.tenant_id
        from public.tenant_members tm
        where tm.user_id = (select auth.uid())
          and tm.role in ('owner', 'admin', 'member', 'viewer')
      )
      or p.tenant_id in (
        select t.id
        from public.tenants t
        where t.user_id = (select auth.uid())
      )
      or public.is_portal_stakeholder_for_project(p.id)
    )
  )
);

create policy media_select_tenant on storage.objects
for select to authenticated
using (
  bucket_id = 'media'
  and (
    (storage.foldername(name))[1] in (
      select tm.tenant_id::text
      from public.tenant_members tm
      where tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'member', 'viewer')
    )
    or (storage.foldername(name))[1] in (
      select t.id::text
      from public.tenants t
      where t.user_id = (select auth.uid())
    )
    or (storage.foldername(name))[1] in (
      select p.id::text
      from public.projects p
      where p.tenant_id in (
        select tm.tenant_id
        from public.tenant_members tm
        where tm.user_id = (select auth.uid())
          and tm.role in ('owner', 'admin', 'member', 'viewer')
      )
      or p.tenant_id in (
        select t.id
        from public.tenants t
        where t.user_id = (select auth.uid())
      )
      or public.is_portal_stakeholder_for_project(p.id)
    )
  )
);
