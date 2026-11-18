-- Re-opening an already-active portal invite must not demote tenant_members.role
-- from viewer back to stakeholder. Missing membership can still be inserted
-- (20261003221500). First accept of an unexpired invited grant may still
-- move viewer → stakeholder.

create or replace function public.enforce_tenant_members_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

comment on function public.enforce_tenant_members_role_change() is
  'Blocks authenticated self-escalation. viewer → stakeholder is only allowed for an unexpired invited grant, not for an already-active portal grant.';
