-- Block authenticated clients from restoring portal access on project_stakeholders.
--
-- Wave 1 (20260906090000) left invitees an UPDATE grant on
-- (status, user_id, accepted_at, updated_at) so the official accept/revoke
-- paths can run as the caller. The UPDATE policy matches the invitee by
-- email or user_id and does not constrain status transitions.
--
-- is_portal_stakeholder_for_project() is true for any row with
-- user_id = auth.uid() and status = 'active'. A revoked or expired invitee
-- can therefore PATCH that row through PostgREST and regain project-scoped
-- portal reads (documents, defects, estimates, change orders, handover,
-- aftercare) without a token or an unexpired invitation.
--
-- Legitimate paths that must keep working:
--   * project managers / tenant owner+admin: revoke (status = revoked)
--   * invitee accept: invited → active, unexpired, email matches JWT,
--     user_id bound to auth.uid()
-- Official accept already requires the token in the API. The email-matching
-- caller can read that token under the SELECT policy, so the trigger keeps
-- the same invited → active window and only closes the bypasses.

create or replace function public.enforce_project_stakeholders_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := (select auth.uid());
  caller_email text := lower(trim(coalesce((select auth.jwt() ->> 'email'), '')));
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if caller is null then
    raise exception 'project_stakeholders update requires authenticated user';
  end if;

  -- Same predicate as public.can_manage_project_membership(tenant, project).
  -- Inlined so this trigger does not depend on that helper's EXECUTE grant.
  if exists (
    select 1 from public.tenants t
    where t.id = old.tenant_id and t.user_id = caller
  )
  or exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = old.tenant_id
      and tm.user_id = caller
      and tm.role in ('owner', 'admin')
  )
  or exists (
    select 1 from public.project_members pm
    where pm.tenant_id = old.tenant_id
      and pm.project_id = old.project_id
      and pm.user_id = caller
      and pm.status = 'active'
      and pm.role in ('manager', 'owner')
  ) then
    return new;
  end if;

  if new.tenant_id is distinct from old.tenant_id
     or new.project_id is distinct from old.project_id
     or new.email is distinct from old.email
     or new.stakeholder_role is distinct from old.stakeholder_role
     or new.token is distinct from old.token
     or new.invited_by is distinct from old.invited_by
     or new.expires_at is distinct from old.expires_at
     or new.created_at is distinct from old.created_at
  then
    raise exception 'project_stakeholders identity columns are immutable for authenticated clients';
  end if;

  if old.status = 'invited'
     and new.status = 'active'
     and old.expires_at > now()
     and new.user_id = caller
     and (old.user_id is null or old.user_id = caller)
     and caller_email <> ''
     and lower(trim(coalesce(old.email, ''))) = caller_email
  then
    return new;
  end if;

  raise exception 'project_stakeholders update not permitted for authenticated clients';
end;
$$;

revoke all on function public.enforce_project_stakeholders_transition() from public, anon, authenticated;
grant execute on function public.enforce_project_stakeholders_transition() to service_role;

drop trigger if exists project_stakeholders_enforce_transition on public.project_stakeholders;
create trigger project_stakeholders_enforce_transition
  before update on public.project_stakeholders
  for each row
  execute function public.enforce_project_stakeholders_transition();

comment on function public.enforce_project_stakeholders_transition() is
  'Allows manager revoke and unexpired invited→active accept. Blocks revoked/expired self-reactivation and user_id reassignment.';
