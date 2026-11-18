-- Policy helpers belong outside the exposed Data API schema. ALTER preserves
-- their OIDs, so existing RLS policies and the identity trigger keep binding.
create schema if not exists app_private;
grant usage on schema app_private to authenticated, service_role;

do $move_intake_helpers$
declare signature text;
begin
  foreach signature in array array[
    'customer_intake_tenant_account_active(uuid)',
    'is_internal_intake_writer(uuid)',
    'has_active_stakeholder_grant_in_tenant(uuid)',
    'customer_intake_stakeholder_authorized(uuid,uuid)',
    'customer_intake_drafts_immutable_identity()'
  ] loop
    if to_regprocedure('public.' || signature) is not null then
      execute 'alter function public.' || signature || ' set schema app_private';
    elsif to_regprocedure('app_private.' || signature) is null then
      raise exception 'Missing intake helper: %', signature;
    end if;
  end loop;
end;
$move_intake_helpers$;

-- SQL bodies resolve names when called; follow the moved dependency explicitly.
create or replace function app_private.customer_intake_stakeholder_authorized(p_project_id uuid, p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_project_id is null then
      app_private.has_active_stakeholder_grant_in_tenant(p_tenant_id)
    else
      public.project_belongs_to_tenant(p_project_id, p_tenant_id)
      and exists (
        select 1
        from public.project_stakeholders ps
        where ps.project_id = p_project_id
          and ps.tenant_id = p_tenant_id
          and ps.user_id = (select auth.uid())
          and ps.status = 'active'
      )
  end;
$$;

revoke all on function app_private.customer_intake_tenant_account_active(uuid) from public, anon;
revoke all on function app_private.is_internal_intake_writer(uuid) from public, anon;
revoke all on function app_private.has_active_stakeholder_grant_in_tenant(uuid) from public, anon;
revoke all on function app_private.customer_intake_stakeholder_authorized(uuid,uuid) from public, anon;
revoke all on function app_private.customer_intake_drafts_immutable_identity() from public, anon;
grant execute on function app_private.customer_intake_tenant_account_active(uuid) to authenticated, service_role;
grant execute on function app_private.is_internal_intake_writer(uuid) to authenticated, service_role;
grant execute on function app_private.has_active_stakeholder_grant_in_tenant(uuid) to authenticated, service_role;
grant execute on function app_private.customer_intake_stakeholder_authorized(uuid,uuid) to authenticated, service_role;
revoke all on function app_private.customer_intake_drafts_immutable_identity() from authenticated;
grant execute on function app_private.customer_intake_drafts_immutable_identity() to service_role;

notify pgrst, 'reload schema';
