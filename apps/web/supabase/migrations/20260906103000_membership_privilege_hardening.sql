-- Release hardening 2026-09-06.
-- Close authenticated privilege escalation on tenant_members and project_stakeholders.
-- Additive forward-fix for current main; historical migrations are not rewritten.

-- ---------------------------------------------------------------------------
-- tenant_members: bind INSERT role to tenant ownership or matching invitation
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
-- tenant_members: prevent authenticated role / identity mutation
-- ---------------------------------------------------------------------------

create or replace function public.enforce_tenant_members_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Server-side service-role operations remain allowed.
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

  -- A live tenant invitation may explicitly authorize a role refresh.
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

  -- Preserve legacy portal accept path: viewer -> stakeholder only with live invite.
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
  'Blocks authenticated self-escalation of tenant_members.role and identity-column mutation.';

-- ---------------------------------------------------------------------------
-- project_stakeholders: split broad access; only project managers may create/delete.
-- Invitees may read/update their own invitation, but privileged columns are immutable.
-- ---------------------------------------------------------------------------

drop policy if exists project_stakeholders_access on public.project_stakeholders;
drop policy if exists project_stakeholders_select on public.project_stakeholders;
drop policy if exists project_stakeholders_insert_internal on public.project_stakeholders;
drop policy if exists project_stakeholders_update on public.project_stakeholders;
drop policy if exists project_stakeholders_delete_internal on public.project_stakeholders;

create policy project_stakeholders_select
  on public.project_stakeholders
  for select
  to authenticated
  using (
    public.can_manage_project_membership(tenant_id, project_id)
    or user_id = (select auth.uid())
    or lower(trim(coalesce(email, ''))) = lower(trim(coalesce((select auth.jwt() ->> 'email'), '')))
  );

create policy project_stakeholders_insert_internal
  on public.project_stakeholders
  for insert
  to authenticated
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
  );

create policy project_stakeholders_update
  on public.project_stakeholders
  for update
  to authenticated
  using (
    public.can_manage_project_membership(tenant_id, project_id)
    or user_id = (select auth.uid())
    or lower(trim(coalesce(email, ''))) = lower(trim(coalesce((select auth.jwt() ->> 'email'), '')))
  )
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    or user_id = (select auth.uid())
    or lower(trim(coalesce(email, ''))) = lower(trim(coalesce((select auth.jwt() ->> 'email'), '')))
  );

create policy project_stakeholders_delete_internal
  on public.project_stakeholders
  for delete
  to authenticated
  using (
    public.can_manage_project_membership(tenant_id, project_id)
  );

-- Authenticated invitees may only update acceptance/revocation lifecycle columns.
-- stakeholder_role, project_id, tenant_id, email and token remain immutable via PostgREST.
revoke update on table public.project_stakeholders from authenticated;
grant update (status, user_id, accepted_at, updated_at)
  on public.project_stakeholders
  to authenticated;
