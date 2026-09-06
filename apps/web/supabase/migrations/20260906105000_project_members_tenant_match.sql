-- RELEASE HARDENING WAVE 1
-- Ensure project_members inserts cannot pair a tenant_id with a project owned by another tenant.
-- project_belongs_to_tenant(...) is introduced by 20260906091000.

drop policy if exists project_members_insert_scoped on public.project_members;

create policy project_members_insert_scoped on public.project_members
  for insert
  to authenticated
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
    and (
      role in ('worker', 'contractor', 'manager')
      or exists (
        select 1 from public.tenants t
        where t.id = tenant_id and t.user_id = (select auth.uid())
      )
      or exists (
        select 1 from public.tenant_members tm
        where tm.tenant_id = project_members.tenant_id
          and tm.user_id = (select auth.uid())
          and tm.role in ('owner', 'admin')
      )
    )
  );
