-- Close PostgREST wipe/forge paths on field_daily_logs (TASK-AISTROYKA-003).
-- The create migration used tenant-wide FOR ALL, so any tenant_members row
-- (including stakeholder) could SELECT/UPDATE/DELETE confirmed contractor logs
-- and skip the draft-only API gates.
--
-- App writes are member+ (`canManageProjects`). RLS mirrors that writer
-- cohort, keeps internal-reader SELECT, binds drafts on INSERT, allows
-- draft edits + draft→confirmed only, and exposes no authenticated DELETE.

drop policy if exists field_daily_logs_tenant_member on public.field_daily_logs;
drop policy if exists field_daily_logs_select_internal on public.field_daily_logs;
drop policy if exists field_daily_logs_insert_internal on public.field_daily_logs;
drop policy if exists field_daily_logs_update_internal on public.field_daily_logs;
drop policy if exists field_daily_logs_delete_internal on public.field_daily_logs;

create policy field_daily_logs_select_internal on public.field_daily_logs
  for select
  to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy field_daily_logs_insert_internal on public.field_daily_logs
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
    and status = 'draft'
    and (created_by is null or created_by = (select auth.uid()))
  );

create policy field_daily_logs_update_internal on public.field_daily_logs
  for update
  to authenticated
  using (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and status = 'draft'
  )
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
    and status in ('draft', 'confirmed')
  );

create or replace function public.enforce_field_daily_log_identity_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if new.id is distinct from old.id
     or new.tenant_id is distinct from old.tenant_id
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'field daily log identity fields are immutable';
  end if;
  if old.status = 'confirmed' then
    raise exception 'confirmed field daily logs cannot be updated';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_field_daily_log_identity_immutable() from public;
grant execute on function public.enforce_field_daily_log_identity_immutable() to authenticated, service_role;

drop trigger if exists field_daily_logs_identity_immutable on public.field_daily_logs;
create trigger field_daily_logs_identity_immutable
  before update on public.field_daily_logs
  for each row execute function public.enforce_field_daily_log_identity_immutable();

comment on table public.field_daily_logs is
  'Contractor field daily log: draft → human confirm. Authenticated writes are writer+draft-only; no client DELETE.';
