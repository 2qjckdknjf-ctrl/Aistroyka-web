-- Recover the existing #244 evidence schema safely; do not recreate or replay it.
begin;

create or replace function public.validate_visual_evidence_project_consistency()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  source_project uuid;
  source_author uuid;
  source_task uuid;
begin
  -- Genuine FK SET NULL actions must withdraw the record rather than retain a
  -- publication with a missing source or prevent authorized parent cleanup.
  if tg_op = 'UPDATE' and pg_catalog.pg_trigger_depth() > 1 and (
    (old.report_id is not null and new.report_id is null)
    or (old.task_id is not null and new.task_id is null)
    or (old.media_id is not null and new.media_id is null)
    or (old.upload_session_id is not null and new.upload_session_id is null)
  ) then
    new.owner_visible := false;
    new.manager_verified := false;
    new.retention_state := 'archived';
    new.provenance := coalesce(new.provenance, '{}'::jsonb) || pg_catalog.jsonb_build_object(
      'removed_source', coalesce(new.provenance->'removed_source', '{}'::jsonb)
        || pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
          'report_id', old.report_id, 'task_id', old.task_id, 'media_id', old.media_id,
          'upload_session_id', old.upload_session_id)));
    return new;
  end if;
  if not exists (select 1 from public.projects p where p.id = new.project_id and p.tenant_id = new.tenant_id) then
    raise exception 'Evidence project is outside tenant' using errcode = '23514';
  end if;
  if new.media_id is not null and not exists (
    select 1 from public.media m where m.id = new.media_id
      and m.tenant_id = new.tenant_id and m.project_id = new.project_id
  ) then
    raise exception 'Evidence media scope mismatch' using errcode = '23514';
  end if;
  if new.task_id is not null and not exists (
    select 1 from public.worker_tasks wt where wt.id = new.task_id
      and wt.tenant_id = new.tenant_id and wt.project_id = new.project_id
  ) then
    raise exception 'Evidence task scope mismatch' using errcode = '23514';
  end if;
  if new.report_id is not null then
    select coalesce(wt.project_id, nullif(pg_catalog.to_jsonb(wd)->>'project_id', '')::uuid), wr.user_id, wr.task_id
      into source_project, source_author, source_task
      from public.worker_reports wr
      left join public.worker_tasks wt on wt.id = wr.task_id and wt.tenant_id = wr.tenant_id
      left join public.worker_day wd on wd.id = wr.day_id and wd.tenant_id = wr.tenant_id
      where wr.id = new.report_id and wr.tenant_id = new.tenant_id;
    if source_project is null or source_project <> new.project_id then
      raise exception 'Evidence report scope is unresolved or mismatched' using errcode = '23514';
    end if;
    if new.uploader_user_id is distinct from source_author then
      raise exception 'Evidence report author mismatch' using errcode = '23514';
    end if;
    if new.task_id is not null and new.task_id is distinct from source_task then
      raise exception 'Evidence task is not the report task' using errcode = '23514';
    end if;
    if new.media_id is not null and not exists (
      select 1 from public.worker_report_media rm
      where rm.report_id = new.report_id and rm.media_id = new.media_id
    ) then
      raise exception 'Evidence media is not linked to report' using errcode = '23514';
    end if;
    if new.upload_session_id is not null and not exists (
      select 1 from public.worker_report_media rm
      where rm.report_id = new.report_id and rm.upload_session_id = new.upload_session_id
    ) then
      raise exception 'Evidence upload is not linked to report' using errcode = '23514';
    end if;
    if new.media_id is not null and new.upload_session_id is not null and not exists (
      select 1 from public.worker_report_media rm where rm.report_id = new.report_id
        and rm.media_id = new.media_id and rm.upload_session_id = new.upload_session_id
    ) then
      raise exception 'Evidence media and upload are not the same source' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.guard_visual_evidence_visibility_columns()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  actor uuid;
  manager boolean;
  report_owner uuid;
  approved boolean := false;
begin
  if tg_op = 'UPDATE' and pg_catalog.pg_trigger_depth() > 1
      and new.retention_state = 'archived' and not new.owner_visible and not new.manager_verified
      and ((old.report_id is not null and new.report_id is null)
        or (old.task_id is not null and new.task_id is null)
        or (old.media_id is not null and new.media_id is null)
        or (old.upload_session_id is not null and new.upload_session_id is null)) then
    return new;
  end if;
  if current_user = 'service_role' then return new; end if;
  actor := auth.uid();
  if actor is null or not public.is_internal_tenant_writer_for_tenant(new.tenant_id)
      or not app_private.customer_intake_tenant_account_active(new.tenant_id) then
    raise exception 'Evidence write denied' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and (
    new.id is distinct from old.id or new.tenant_id is distinct from old.tenant_id
    or new.project_id is distinct from old.project_id or new.report_id is distinct from old.report_id
    or new.task_id is distinct from old.task_id or new.media_id is distinct from old.media_id
    or new.upload_session_id is distinct from old.upload_session_id
    or new.uploader_user_id is distinct from old.uploader_user_id
  ) then
    raise exception 'Evidence source identity is immutable' using errcode = '23514';
  end if;
  manager := exists (select 1 from public.tenants t where t.id = new.tenant_id and t.user_id = actor)
    or exists (select 1 from public.tenant_members tm where tm.tenant_id = new.tenant_id
      and tm.user_id = actor and tm.role in ('owner', 'admin'))
    or exists (select 1 from public.project_members pm where pm.tenant_id = new.tenant_id
      and pm.project_id = new.project_id and pm.user_id = actor and pm.role = 'manager');
  if new.report_id is not null then
    select wr.user_id, wr.status = 'approved' into report_owner, approved
      from public.worker_reports wr where wr.id = new.report_id and wr.tenant_id = new.tenant_id;
    if not found then raise exception 'Evidence report unavailable' using errcode = '23514'; end if;
  end if;
  if tg_op = 'INSERT' and new.report_id is null and new.uploader_user_id is distinct from actor then
    raise exception 'Manual evidence author must be the caller' using errcode = '42501';
  end if;
  if not manager and (new.uploader_user_id is distinct from actor
      or (new.report_id is not null and report_owner is distinct from actor)) then
    raise exception 'Evidence author mismatch' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' and not manager and coalesce(approved, false) then
    raise exception 'Cannot add evidence after report approval' using errcode = '23514';
  end if;
  if tg_op = 'INSERT' and not manager then
    new.owner_visible := false;
    new.manager_verified := false;
  elsif tg_op = 'UPDATE' and not manager and (
    new.owner_visible is distinct from old.owner_visible
    or new.manager_verified is distinct from old.manager_verified
  ) then
    raise exception 'Evidence publication is manager controlled' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and (old.owner_visible or old.manager_verified or coalesce(approved, false))
      and (pg_catalog.to_jsonb(new) - 'owner_visible' - 'manager_verified' - 'updated_at')
          is distinct from (pg_catalog.to_jsonb(old) - 'owner_visible' - 'manager_verified' - 'updated_at') then
    raise exception 'Reviewed evidence content is immutable; create a revision' using errcode = '23514';
  end if;
  if (new.owner_visible or new.manager_verified) and new.report_id is not null and not coalesce(approved, false) then
    raise exception 'Evidence report is not approved' using errcode = '23514';
  end if;
  if new.owner_visible and (new.manager_verified is not true or new.internal_only is not false
      or new.retention_state is distinct from 'active') then
    raise exception 'Evidence is not eligible for customer publication' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_visual_evidence_project_consistency() from public, anon, authenticated;
revoke all on function public.guard_visual_evidence_visibility_columns() from public, anon, authenticated;
grant execute on function public.validate_visual_evidence_project_consistency() to service_role;
grant execute on function public.guard_visual_evidence_visibility_columns() to service_role;

alter table public.visual_evidence_records drop constraint if exists visual_evidence_media_ref;
alter table public.visual_evidence_records add constraint visual_evidence_media_ref
check (retention_state <> 'active' or media_id is not null or upload_session_id is not null);

-- Raw records include private provenance/device/actor fields. Customers must use
-- an explicit published-only projection, not SELECT * on the raw table.
drop policy if exists visual_evidence_stakeholder_read on public.visual_evidence_records;
drop policy if exists visual_evidence_internal_select on public.visual_evidence_records;
create policy visual_evidence_internal_select on public.visual_evidence_records for select to authenticated
using (public.is_internal_tenant_reader_for_tenant(tenant_id)
  and app_private.customer_intake_tenant_account_active(tenant_id));

drop policy if exists visual_evidence_worker_insert on public.visual_evidence_records;
drop policy if exists visual_evidence_worker_update on public.visual_evidence_records;
drop policy if exists visual_evidence_manager_visibility_update on public.visual_evidence_records;
create policy visual_evidence_worker_insert on public.visual_evidence_records for insert to authenticated
with check (public.is_internal_tenant_writer_for_tenant(tenant_id)
  and app_private.customer_intake_tenant_account_active(tenant_id));
create policy visual_evidence_worker_update on public.visual_evidence_records for update to authenticated
using (public.is_internal_tenant_writer_for_tenant(tenant_id)
  and app_private.customer_intake_tenant_account_active(tenant_id))
with check (public.is_internal_tenant_writer_for_tenant(tenant_id)
  and app_private.customer_intake_tenant_account_active(tenant_id));

commit;
