-- RELEASE HARDENING WAVE 1
-- Close authenticated privilege escalation on tenant_members and project_stakeholders.
--
-- Current-main finding:
-- tenant_members_update_self only constrained user_id = auth.uid(), so an authenticated
-- user could change their own role. Invite insertion also did not bind the inserted role
-- to the invitation. project_stakeholders had broad write semantics for invitees.

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
-- ---------------------------------------------------------------------------

create or replace function public.enforce_tenant_members_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- service_role bypasses RLS but still fires triggers; allow trusted server paths.
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

  -- Portal accept may promote a legacy viewer to stakeholder for a pending invite.
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
  'Blocks PostgREST self-escalation of tenant_members.role; allows invite-matched and viewer-to-stakeholder portal acceptance.';

-- ---------------------------------------------------------------------------
-- project_stakeholders: split read/write access and protect privileged columns
-- ---------------------------------------------------------------------------

drop policy if exists project_stakeholders_access on public.project_stakeholders;

drop policy if exists project_stakeholders_select on public.project_stakeholders;
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

drop policy if exists project_stakeholders_insert_internal on public.project_stakeholders;
create policy project_stakeholders_insert_internal
  on public.project_stakeholders
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
  );

drop policy if exists project_stakeholders_update on public.project_stakeholders;
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

drop policy if exists project_stakeholders_delete_internal on public.project_stakeholders;
create policy project_stakeholders_delete_internal
  on public.project_stakeholders
  for delete
  to authenticated
  using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
  );

-- Invitees may only mutate acceptance lifecycle fields; privileged routing/role columns
-- remain immutable to authenticated PostgREST clients.
revoke update on table public.project_stakeholders from authenticated;
grant update (status, user_id, accepted_at, updated_at)
  on public.project_stakeholders
  to authenticated;
