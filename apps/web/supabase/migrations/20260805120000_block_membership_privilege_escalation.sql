-- CRITICAL: authenticated users could escalate tenant / portal privileges via PostgREST.
--
-- 1) tenant_members_update_self allowed UPDATE of own row with only user_id = auth.uid(),
--    so a stakeholder/member/viewer could set role = 'admin'|'owner'.
-- 2) tenant_members_insert_self_or_invited did not bind role to the invitation role,
--    so an invitee invited as viewer/member could INSERT as admin.
-- 3) project_stakeholders_access was FOR ALL with invitee-email match, so an invitee
--    could INSERT/UPDATE stakeholder_role, project_id, or tenant_id (self-promote /
--    cross-project portal attach).
--
-- Fix: bind invite INSERT role; block self role escalation via trigger; split
-- project_stakeholders policies and revoke privileged column UPDATEs from authenticated.

-- ---------------------------------------------------------------------------
-- tenant_members: bind INSERT role to a matching invitation (or own-tenant bootstrap)
-- ---------------------------------------------------------------------------

drop policy if exists tenant_members_insert_self_or_invited on public.tenant_members;

create policy tenant_members_insert_self_or_invited
  on public.tenant_members
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      (
        tenant_id in (
          select t.id from public.tenants t where t.user_id = (select auth.uid())
        )
        and role in ('owner', 'admin')
      )
      or exists (
        select 1
        from public.tenant_invitations ti
        where ti.tenant_id = tenant_members.tenant_id
          and lower(ti.email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
          and ti.expires_at > now()
          and ti.role = tenant_members.role
      )
      or (
        role = 'stakeholder'
        and exists (
          select 1
          from public.project_stakeholders ps
          where ps.tenant_id = tenant_members.tenant_id
            and lower(trim(ps.email)) = lower(trim(coalesce((select auth.jwt() ->> 'email'), '')))
            and ps.status = 'invited'
            and ps.expires_at > now()
        )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- tenant_members: prevent authenticated privilege escalation on UPDATE
-- (keeps invite upsert / viewer→stakeholder accept working when authorized)
-- ---------------------------------------------------------------------------

create or replace function public.enforce_tenant_members_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- service_role bypasses RLS but still fires triggers; allow ops/admin paths.
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'tenant_members.user_id is immutable for authenticated clients';
  end if;
  if new.tenant_id is distinct from old.tenant_id then
    raise exception 'tenant_members.tenant_id is immutable for authenticated clients';
  end if;

  if new.role is not distinct from old.role then
    return new;
  end if;

  -- Re-accept / role refresh only when a matching live invitation authorizes the new role.
  if exists (
    select 1
    from public.tenant_invitations ti
    where ti.tenant_id = new.tenant_id
      and lower(ti.email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
      and ti.expires_at > now()
      and ti.role = new.role
  ) then
    return new;
  end if;

  -- Portal accept may promote legacy viewer → stakeholder when invite is pending.
  if old.role = 'viewer'
     and new.role = 'stakeholder'
     and exists (
       select 1
       from public.project_stakeholders ps
       where ps.tenant_id = new.tenant_id
         and lower(trim(ps.email)) = lower(trim(coalesce((select auth.jwt() ->> 'email'), '')))
         and ps.status = 'invited'
         and ps.expires_at > now()
     ) then
    return new;
  end if;

  raise exception 'tenant_members.role change not permitted for authenticated clients';
end;
$$;

drop trigger if exists tenant_members_enforce_role_change on public.tenant_members;
create trigger tenant_members_enforce_role_change
  before update on public.tenant_members
  for each row
  execute function public.enforce_tenant_members_role_change();

revoke all on function public.enforce_tenant_members_role_change() from public;

comment on function public.enforce_tenant_members_role_change() is
  'Blocks PostgREST self-escalation of tenant_members.role; allows invite-matched and viewer→stakeholder portal accept.';

-- ---------------------------------------------------------------------------
-- project_stakeholders: SELECT for invitee; INSERT/DELETE internal-only;
-- UPDATE allowed for invitee accept but privileged columns revoked.
-- ---------------------------------------------------------------------------

drop policy if exists project_stakeholders_access on public.project_stakeholders;

create policy project_stakeholders_select
  on public.project_stakeholders
  for select
  to authenticated
  using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
    or user_id = (select auth.uid())
    or lower(trim(coalesce(email, ''))) = lower(trim(coalesce((select auth.jwt() ->> 'email'), '')))
  );

create policy project_stakeholders_insert_internal
  on public.project_stakeholders
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
  );

create policy project_stakeholders_update
  on public.project_stakeholders
  for update
  to authenticated
  using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
    or user_id = (select auth.uid())
    or lower(trim(coalesce(email, ''))) = lower(trim(coalesce((select auth.jwt() ->> 'email'), '')))
  )
  with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
    or user_id = (select auth.uid())
    or lower(trim(coalesce(email, ''))) = lower(trim(coalesce((select auth.jwt() ->> 'email'), '')))
  );

create policy project_stakeholders_delete_internal
  on public.project_stakeholders
  for delete
  to authenticated
  using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
  );

-- Invitees/managers may activate/revoke via status (+ accept binds user_id/accepted_at).
-- stakeholder_role, project_id, tenant_id, email, token stay immutable from PostgREST.
revoke update on table public.project_stakeholders from authenticated;
grant update (status, user_id, accepted_at, updated_at)
  on public.project_stakeholders
  to authenticated;
