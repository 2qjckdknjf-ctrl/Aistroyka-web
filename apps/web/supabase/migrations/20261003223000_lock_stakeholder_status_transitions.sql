-- Invitees may complete invited → active once. They cannot reopen a revoked grant
-- by writing project_stakeholders.status. Managers keep full status control.

create or replace function public.enforce_project_stakeholders_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if public.can_manage_project_membership(new.tenant_id, new.project_id) then
    return new;
  end if;

  if old.status = 'invited'
     and new.status = 'active'
     and new.user_id = (select auth.uid())
     and (old.user_id is null or old.user_id = (select auth.uid())) then
    return new;
  end if;

  if new.status is not distinct from old.status
     and new.user_id is not distinct from old.user_id then
    return new;
  end if;

  raise exception 'project_stakeholders.status change not permitted for this caller';
end;
$$;

drop trigger if exists project_stakeholders_enforce_status_change on public.project_stakeholders;
create trigger project_stakeholders_enforce_status_change
  before update on public.project_stakeholders
  for each row
  execute function public.enforce_project_stakeholders_status_change();

revoke all on function public.enforce_project_stakeholders_status_change() from public;

comment on function public.enforce_project_stakeholders_status_change() is
  'Invitees may only transition invited → active for themselves; revoked grants cannot be self-restored.';
