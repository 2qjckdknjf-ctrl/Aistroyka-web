-- Fix infinite recursion on tenant_members SELECT RLS.
-- The previous policy queried tenant_members inside its own USING clause; any policy
-- that subselected tenant_members (e.g. tenants, health anon probe) triggered recursion.
--
-- SECURITY DEFINER helper reads membership with owner privileges so it does not
-- re-enter tenant_members RLS. It still scopes rows to auth.uid() of the invoker.

create or replace function public.current_user_tenant_ids()
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

comment on function public.current_user_tenant_ids() is
  'Returns tenant IDs for the invoking user; used by RLS to avoid self-referential tenant_members policies.';

revoke all on function public.current_user_tenant_ids() from public;
grant execute on function public.current_user_tenant_ids() to anon, authenticated;

drop policy if exists "tenant_members_select_own" on public.tenant_members;
create policy "tenant_members_select_own" on public.tenant_members for select using (
  tenant_id in (select public.current_user_tenant_ids())
  or user_id = (select auth.uid())
);
