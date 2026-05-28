-- Move SECURITY DEFINER helper logic to non-exposed schema and keep public
-- SECURITY INVOKER wrappers for policy compatibility.

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated, service_role;

create or replace function app_private.current_user_tenant_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select tm.tenant_id
  from public.tenant_members tm
  where tm.user_id = (select auth.uid());
$$;

revoke all on function app_private.current_user_tenant_ids() from public;
grant execute on function app_private.current_user_tenant_ids() to anon, authenticated, service_role;

create or replace function public.current_user_tenant_ids()
returns setof uuid
language sql
security invoker
set search_path = public, app_private
stable
as $$
  select * from app_private.current_user_tenant_ids();
$$;

revoke all on function public.current_user_tenant_ids() from public;
grant execute on function public.current_user_tenant_ids() to anon, authenticated, service_role;

create or replace function app_private.is_internal_tenant_reader_for_tenant(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenants t
    where t.id = p_tenant_id and t.user_id = (select auth.uid())
  )
  or exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner', 'admin', 'member', 'viewer')
  );
$$;

revoke all on function app_private.is_internal_tenant_reader_for_tenant(uuid) from public;
grant execute on function app_private.is_internal_tenant_reader_for_tenant(uuid) to authenticated, service_role;

create or replace function public.is_internal_tenant_reader_for_tenant(p_tenant_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public, app_private
as $$
  select app_private.is_internal_tenant_reader_for_tenant(p_tenant_id);
$$;

revoke all on function public.is_internal_tenant_reader_for_tenant(uuid) from public;
grant execute on function public.is_internal_tenant_reader_for_tenant(uuid) to authenticated, service_role;

create or replace function app_private.is_portal_stakeholder_for_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.project_stakeholders ps
    where ps.project_id = p_project_id
      and ps.user_id = (select auth.uid())
      and ps.status = 'active'
  );
$$;

revoke all on function app_private.is_portal_stakeholder_for_project(uuid) from public;
grant execute on function app_private.is_portal_stakeholder_for_project(uuid) to authenticated, service_role;

create or replace function public.is_portal_stakeholder_for_project(p_project_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public, app_private
as $$
  select app_private.is_portal_stakeholder_for_project(p_project_id);
$$;

revoke all on function public.is_portal_stakeholder_for_project(uuid) from public;
grant execute on function public.is_portal_stakeholder_for_project(uuid) to authenticated, service_role;

create or replace function app_private.is_portal_stakeholder_for_document(p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_documents pd
    where pd.id = p_document_id
      and app_private.is_portal_stakeholder_for_project(pd.project_id)
  );
$$;

revoke all on function app_private.is_portal_stakeholder_for_document(uuid) from public;
grant execute on function app_private.is_portal_stakeholder_for_document(uuid) to authenticated, service_role;

create or replace function public.is_portal_stakeholder_for_document(p_document_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public, app_private
as $$
  select app_private.is_portal_stakeholder_for_document(p_document_id);
$$;

revoke all on function public.is_portal_stakeholder_for_document(uuid) from public;
grant execute on function public.is_portal_stakeholder_for_document(uuid) to authenticated, service_role;
