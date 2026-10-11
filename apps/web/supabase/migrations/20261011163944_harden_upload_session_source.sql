-- Finalized upload paths are reviewed source identities, not editable pointers.
begin;

create or replace function app_private.lock_report_attachment_review()
returns trigger language plpgsql security definer set search_path=pg_catalog as $$
declare parent_status text;
begin
  select wr.status into parent_status from public.worker_reports wr
  where wr.id=new.report_id and (auth.role()='service_role' or (
    wr.user_id=auth.uid() and public.is_internal_tenant_writer_for_tenant(wr.tenant_id)
    and app_private.customer_intake_tenant_account_active(wr.tenant_id))) for share of wr;
  if not found then raise exception 'Report attachment unavailable' using errcode='42501'; end if;
  if auth.role() is distinct from 'service_role' and parent_status not in ('draft','changes_requested') then
    raise exception 'Report attachment is no longer editable' using errcode='23514';
  end if;
  if tg_op='INSERT' then new.created_at:=clock_timestamp(); end if;
  return new;
end;
$$;
revoke all on function app_private.lock_report_attachment_review() from public, anon, authenticated;
grant execute on function app_private.lock_report_attachment_review() to service_role;
drop trigger if exists trg_report_attachment_review_lock on public.worker_report_media;
create trigger trg_report_attachment_review_lock before insert or update on public.worker_report_media
for each row execute function app_private.lock_report_attachment_review();

-- Keep review history independent from reversible visibility flags/attachments.
create table if not exists app_private.reviewed_media_sources (
  media_id uuid primary key references public.media(id) on delete cascade,
  tenant_id uuid not null, project_id uuid, source_type text, file_url text,
  sealed_at timestamptz not null default now()
);
alter table app_private.reviewed_media_sources enable row level security;
revoke all on app_private.reviewed_media_sources from public, anon, authenticated;
grant all on app_private.reviewed_media_sources to service_role;


create or replace function app_private.seal_reviewed_report_media()
returns trigger language plpgsql security definer set search_path=pg_catalog as $$
begin
  if new.status not in ('approved','rejected','changes_requested') then return new; end if;
  if new.status='approved' and exists(select 1 from public.worker_report_media rm
      left join public.media m on m.id=rm.media_id and m.tenant_id=new.tenant_id
      where rm.report_id=new.id and rm.media_id is not null and m.id is null) then
    raise exception 'Report original media is missing' using errcode='23514';
  end if;
  if new.status <> 'approved' and (new.reviewed_at is null
      or (tg_op='UPDATE' and new.status is not distinct from old.status
        and new.reviewed_at is not distinct from old.reviewed_at)) then return new; end if;
  -- The report UPDATE lock already serializes media writers; taking a media lock
  -- here would invert that ordering against a media writer waiting on this report.
  insert into app_private.reviewed_media_sources(media_id,tenant_id,project_id,source_type,file_url)
  select distinct m.id,m.tenant_id,m.project_id,m.type::text,m.file_url from public.media m
  join public.worker_report_media rm on rm.media_id=m.id
  where rm.report_id=new.id and m.tenant_id=new.tenant_id on conflict(media_id) do nothing;
  return new;
end;
$$;
revoke all on function app_private.seal_reviewed_report_media() from public, anon, authenticated;
grant execute on function app_private.seal_reviewed_report_media() to service_role;
drop trigger if exists trg_report_reviewed_media_seal on public.worker_reports;
create trigger trg_report_reviewed_media_seal after insert or update of status,reviewed_at on public.worker_reports
for each row execute function app_private.seal_reviewed_report_media();

create or replace function public.guard_upload_session_source()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  relative_path text;
  session_prefix text;
begin
  if tg_op = 'UPDATE' then
    if auth.role() = 'authenticated' and new.expires_at is distinct from old.expires_at then
      raise exception 'Upload session expiry is server controlled' using errcode = '23514';
    end if;
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

  if auth.role() = 'service_role' then return new; end if;
  if auth.uid() is null or new.user_id is distinct from auth.uid()
      or not public.is_internal_tenant_writer_for_tenant(new.tenant_id)
      or not app_private.customer_intake_tenant_account_active(new.tenant_id) then
    raise exception 'Upload session write denied' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' and (new.status <> 'created' or new.object_path is not null) then
    raise exception 'Upload sessions start as empty created sources' using errcode = '23514';
  end if;
  if tg_op = 'INSERT' then
    new.created_at := now();
    if new.expires_at <= now() or new.expires_at > now() + interval '61 minutes' then
      raise exception 'Upload session expiry must be within the server TTL' using errcode = '23514';
    end if;
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
declare source_report record;
begin
  if tg_op = 'DELETE' and auth.role() = 'service_role' then return old; end if;
  if tg_op = 'UPDATE' and new.id is distinct from old.id then
    raise exception 'Media identity is immutable; create a new media record' using errcode='23514';
  end if;
  if tg_op = 'UPDATE' and new.id is not distinct from old.id and new.tenant_id is not distinct from old.tenant_id
      and new.project_id is not distinct from old.project_id and new.type is not distinct from old.type
      and new.file_url is not distinct from old.file_url then return new; end if;
  if exists (select 1 from app_private.reviewed_media_sources s where s.media_id=old.id) then
    raise exception 'Previously reviewed media source is immutable; create a new media record' using errcode='23514';
  end if;
  for source_report in
    select wr.status, wr.reviewed_at from public.worker_reports wr
    join public.worker_report_media rm on rm.report_id = wr.id
    where rm.media_id = old.id and wr.tenant_id = old.tenant_id
    for share of wr
  loop
    if source_report.status = 'approved' or (tg_op='DELETE' and source_report.status='submitted') then
      raise exception 'Reviewed media source is immutable; create a new media record' using errcode = '23514';
    end if;
  end loop;
  -- Publication locks this media row first; do not lock evidence rows here and
  -- invert the order against an evidence UPDATE that already holds its row.
  if exists (select 1 from public.visual_evidence_records e
      where e.media_id = old.id and e.tenant_id = old.tenant_id
        and (e.owner_visible or e.manager_verified)) then
    raise exception 'Published media source is immutable; create a new media record' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function app_private.guard_reviewed_media_source() from public, anon, authenticated;
grant execute on function app_private.guard_reviewed_media_source() to service_role;
drop trigger if exists trg_reviewed_media_source on public.media;
create trigger trg_reviewed_media_source before update or delete on public.media
for each row execute function app_private.guard_reviewed_media_source();

create or replace function app_private.lock_published_evidence_media_source()
returns trigger language plpgsql security definer set search_path = pg_catalog as $$
begin
  if new.media_id is null or not (new.owner_visible or new.manager_verified) then return new; end if;
  if auth.role() is distinct from 'service_role' and (auth.uid() is null
      or not public.is_internal_tenant_writer_for_tenant(new.tenant_id)
      or not app_private.customer_intake_tenant_account_active(new.tenant_id)) then
    raise exception 'Evidence source lock denied' using errcode = '42501';
  end if;
  perform 1 from public.media m where m.id = new.media_id
    and m.tenant_id = new.tenant_id and m.project_id = new.project_id for share of m;
  if not found then raise exception 'Published media source unavailable' using errcode = '23514'; end if;
  return new;
end;
$$;
revoke all on function app_private.lock_published_evidence_media_source() from public, anon, authenticated;
grant execute on function app_private.lock_published_evidence_media_source() to service_role;
drop trigger if exists trg_evidence_media_source_lock on public.visual_evidence_records;
create trigger trg_evidence_media_source_lock before insert or update on public.visual_evidence_records
for each row execute function app_private.lock_published_evidence_media_source();

create or replace function app_private.seal_published_evidence_media_source()
returns trigger language plpgsql security definer set search_path=pg_catalog as $$
begin
  if new.media_id is null or not (new.owner_visible or new.manager_verified) then return new; end if;
  -- The BEFORE lock remains held. Seal only the final flags after the visibility
  -- guard has stripped any worker attempt at self-publication.
  insert into app_private.reviewed_media_sources(media_id,tenant_id,project_id,source_type,file_url)
  select m.id,m.tenant_id,m.project_id,m.type::text,m.file_url from public.media m
  where m.id=new.media_id and m.tenant_id=new.tenant_id and m.project_id=new.project_id
  on conflict(media_id) do nothing;
  return new;
end;
$$;
revoke all on function app_private.seal_published_evidence_media_source() from public, anon, authenticated;
grant execute on function app_private.seal_published_evidence_media_source() to service_role;
drop trigger if exists trg_evidence_media_source_seal on public.visual_evidence_records;
create trigger trg_evidence_media_source_seal after insert or update on public.visual_evidence_records
for each row execute function app_private.seal_published_evidence_media_source();

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

-- Seed after all source/report/evidence DDL locks are held, from the latest
-- committed bindings rather than a snapshot taken before guard installation.
insert into app_private.reviewed_media_sources(media_id,tenant_id,project_id,source_type,file_url)
select distinct m.id,m.tenant_id,m.project_id,m.type::text,m.file_url from public.media m
where exists (select 1 from public.worker_report_media rm join public.worker_reports wr on wr.id=rm.report_id
    where rm.media_id=m.id and wr.tenant_id=m.tenant_id and (wr.status='approved'
      or (wr.reviewed_at is not null and rm.created_at <= wr.reviewed_at)))
  or exists (select 1 from public.visual_evidence_records e where e.media_id=m.id and e.tenant_id=m.tenant_id
    and (e.owner_visible or e.manager_verified))
on conflict(media_id) do nothing;

commit;
