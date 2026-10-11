-- Preserve internal history/revisions while allowing only one active publication per source.
begin;
do $$
begin
  if exists (select 1 from public.visual_evidence_records
      where owner_visible and manager_verified and retention_state = 'active' and media_id is not null
      group by tenant_id, media_id having count(*) > 1)
    or exists (select 1 from public.visual_evidence_records
      where owner_visible and manager_verified and retention_state = 'active' and upload_session_id is not null
      group by tenant_id, upload_session_id having count(*) > 1) then
    raise exception 'Duplicate published sources require explicit reconciliation before this migration'
      using errcode = '23505';
  end if;
end;
$$;
create unique index if not exists visual_evidence_one_published_media
  on public.visual_evidence_records(tenant_id, media_id)
  where media_id is not null and owner_visible and manager_verified and retention_state = 'active';
create unique index if not exists visual_evidence_one_published_upload
  on public.visual_evidence_records(tenant_id, upload_session_id)
  where upload_session_id is not null and owner_visible and manager_verified and retention_state = 'active';
comment on index public.visual_evidence_one_published_media is
  'Concurrent publications of overlapping media sources cannot create duplicate customer evidence.';
comment on index public.visual_evidence_one_published_upload is
  'Concurrent publications of overlapping upload sources cannot create duplicate customer evidence.';
-- Code fails closed until the actual indexes are present and valid, including during staged rollout.
create or replace function public.published_evidence_source_guard_ready()
returns boolean language sql stable security invoker set search_path = pg_catalog as $$
  select count(*) = 2 from pg_catalog.pg_index
  where indexrelid in (pg_catalog.to_regclass('public.visual_evidence_one_published_media'),
    pg_catalog.to_regclass('public.visual_evidence_one_published_upload'))
    and indisunique and indisvalid and indisready;
$$;
revoke all on function public.published_evidence_source_guard_ready() from public, anon;
grant execute on function public.published_evidence_source_guard_ready() to authenticated, service_role;
commit;
