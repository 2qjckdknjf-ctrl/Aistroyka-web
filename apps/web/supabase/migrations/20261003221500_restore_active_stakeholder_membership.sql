-- Allow an already-active portal stakeholder to restore tenant_members.role = stakeholder
-- for the same user_id. First-accept still requires an invited, unexpired grant.

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
            and (
              (ps.status = 'invited' and ps.expires_at > now())
              or (ps.status = 'active' and ps.user_id = (select auth.uid()))
            )
        )
      )
    )
  );

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
         and (
           (ps.status = 'invited' and ps.expires_at > now())
           or (ps.status = 'active' and ps.user_id = (select auth.uid()))
         )
     ) then
    return new;
  end if;

  raise exception 'tenant_members.role change not permitted for authenticated clients';
end;
$$;
