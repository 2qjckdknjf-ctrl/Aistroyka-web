-- Finalized upload paths are reviewed source identities, not editable pointers.
begin;

create or replace function public.guard_upload_session_source()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  relative_path text;
  session_prefix text;
begin
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id or new.tenant_id is distinct from old.tenant_id
        or new.user_id is distinct from old.user_id or new.purpose is distinct from old.purpose
        or new.created_at is distinct from old.created_at then
      raise exception 'Upload session identity is immutable' using errcode = '23514';
    end if;
    if old.status in ('finalized', 'expired') and (
      new.status is distinct from old.status or new.object_path is distinct from old.object_path
      or new.mime_type is distinct from old.mime_type or new.size_bytes is distinct from old.size_bytes
      or new.checksum is distinct from old.checksum
    ) then
      raise exception 'Completed upload source is immutable; create a new session' using errcode = '23514';
    end if;
    if old.status = 'uploaded' and new.status = 'created' then
      raise exception 'Upload status cannot move backwards' using errcode = '23514';
    end if;
  end if;

  if current_user = 'service_role' then return new; end if;
  if auth.uid() is null or new.user_id is distinct from auth.uid()
      or not public.is_internal_tenant_writer_for_tenant(new.tenant_id)
      or not app_private.customer_intake_tenant_account_active(new.tenant_id) then
    raise exception 'Upload session write denied' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' and (new.status <> 'created' or new.object_path is not null) then
    raise exception 'Upload sessions start as empty created sources' using errcode = '23514';
  end if;
  if new.object_path is not null then
    relative_path := case when left(new.object_path, 6) = 'media/' then substring(new.object_path from 7) else new.object_path end;
    session_prefix := new.tenant_id::text || '/' || new.id::text;
    if (relative_path <> session_prefix and left(relative_path, length(session_prefix) + 1) <> session_prefix || '/')
        or relative_path like '%..%' or position(chr(92) in relative_path) > 0 or position('%' in relative_path) > 0
        or relative_path like '%//%' then
      raise exception 'Upload object is outside its session path' using errcode = '23514';
    end if;
  end if;
  if new.status = 'finalized' and (new.object_path is null or
      (tg_op = 'UPDATE' and old.status <> 'finalized' and old.expires_at <= now())) then
    raise exception 'Upload source is missing or expired' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_upload_session_source() from public, anon, authenticated;
grant execute on function public.guard_upload_session_source() to service_role;
drop trigger if exists trg_upload_session_source on public.upload_sessions;
create trigger trg_upload_session_source before insert or update on public.upload_sessions
for each row execute function public.guard_upload_session_source();

-- Media-backed records have the same parent-pointer risk as session-backed ones.
-- Row locks serialize path changes with report approval and manual publication.
create index if not exists idx_worker_report_media_source_media on public.worker_report_media(media_id) where media_id is not null;
create index if not exists idx_visual_evidence_source_media on public.visual_evidence_records(media_id) where media_id is not null;
create or replace function app_private.guard_reviewed_media_source()
returns trigger language plpgsql security definer set search_path = pg_catalog as $$
declare source_report record; source_evidence record;
begin
  if new.id is not distinct from old.id and new.tenant_id is not distinct from old.tenant_id
      and new.project_id is not distinct from old.project_id and new.type is not distinct from old.type
      and new.file_url is not distinct from old.file_url then return new; end if;
  for source_report in
    select wr.status, wr.reviewed_at from public.worker_reports wr
    join public.worker_report_media rm on rm.report_id = wr.id
    where rm.media_id = old.id and wr.tenant_id = old.tenant_id
    for share of wr
  loop
    if source_report.status = 'approved' or source_report.reviewed_at is not null then
      raise exception 'Reviewed media source is immutable; create a new media record' using errcode = '23514';
    end if;
  end loop;
  for source_evidence in
    select e.owner_visible, e.manager_verified from public.visual_evidence_records e
    where e.media_id = old.id and e.tenant_id = old.tenant_id for share of e
  loop
    if source_evidence.owner_visible or source_evidence.manager_verified then
      raise exception 'Published media source is immutable; create a new media record' using errcode = '23514';
    end if;
  end loop;
  return new;
end;
$$;
revoke all on function app_private.guard_reviewed_media_source() from public, anon, authenticated;
grant execute on function app_private.guard_reviewed_media_source() to service_role;
drop trigger if exists trg_reviewed_media_source on public.media;
create trigger trg_reviewed_media_source before update on public.media
for each row execute function app_private.guard_reviewed_media_source();

drop policy if exists upload_sessions_internal on public.upload_sessions;
drop policy if exists upload_sessions_select_internal on public.upload_sessions;
drop policy if exists upload_sessions_insert_own on public.upload_sessions;
drop policy if exists upload_sessions_update_own on public.upload_sessions;
drop policy if exists upload_sessions_internal_select on public.upload_sessions;
drop policy if exists upload_sessions_own_insert on public.upload_sessions;
drop policy if exists upload_sessions_own_update on public.upload_sessions;
drop policy if exists upload_sessions_own_delete on public.upload_sessions;
create policy upload_sessions_internal_select on public.upload_sessions for select to authenticated
using (public.is_internal_tenant_reader_for_tenant(tenant_id)
  and app_private.customer_intake_tenant_account_active(tenant_id));
create policy upload_sessions_own_insert on public.upload_sessions for insert to authenticated
with check (user_id = auth.uid() and public.is_internal_tenant_writer_for_tenant(tenant_id)
  and app_private.customer_intake_tenant_account_active(tenant_id));
create policy upload_sessions_own_update on public.upload_sessions for update to authenticated
using (user_id = auth.uid() and public.is_internal_tenant_writer_for_tenant(tenant_id)
  and app_private.customer_intake_tenant_account_active(tenant_id))
with check (user_id = auth.uid() and public.is_internal_tenant_writer_for_tenant(tenant_id)
  and app_private.customer_intake_tenant_account_active(tenant_id));
create policy upload_sessions_own_delete on public.upload_sessions for delete to authenticated
using (user_id = auth.uid() and status in ('created', 'uploaded', 'expired')
  and public.is_internal_tenant_writer_for_tenant(tenant_id)
  and app_private.customer_intake_tenant_account_active(tenant_id));

commit;
