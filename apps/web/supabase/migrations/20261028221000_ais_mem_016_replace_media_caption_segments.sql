-- AIS-MEM-016: atomic caption re-index.
-- Delete + insert must be one transaction so a failed insert cannot wipe prior segments.

create or replace function public.replace_media_caption_segments(
  p_tenant_id uuid,
  p_project_id uuid,
  p_media_id uuid,
  p_source_kind text,
  p_created_by uuid,
  p_rows jsonb
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  n integer;
begin
  if p_tenant_id is null or p_project_id is null or p_media_id is null or p_created_by is null then
    raise exception 'required ids missing';
  end if;

  if p_source_kind is null or p_source_kind not in ('transcription', 'caption', 'manual') then
    raise exception 'invalid source_kind';
  end if;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) < 1 then
    raise exception 'no caption text to index';
  end if;

  if not exists (
    select 1
    from public.media m
    where m.id = p_media_id
      and m.tenant_id = p_tenant_id
      and m.project_id = p_project_id
  ) then
    raise exception 'media not found';
  end if;

  delete from public.media_caption_segments s
  where s.tenant_id = p_tenant_id
    and s.media_id = p_media_id
    and s.source_kind = p_source_kind;

  insert into public.media_caption_segments (
    tenant_id,
    project_id,
    media_id,
    source_kind,
    segment_index,
    start_ms,
    end_ms,
    text,
    language,
    clock_uncertainty,
    created_by
  )
  select
    p_tenant_id,
    p_project_id,
    p_media_id,
    p_source_kind,
    (elem->>'segment_index')::integer,
    (elem->>'start_ms')::integer,
    (elem->>'end_ms')::integer,
    elem->>'text',
    nullif(elem->>'language', ''),
    coalesce(nullif(elem->>'clock_uncertainty', ''), 'unknown'),
    p_created_by
  from jsonb_array_elements(p_rows) as elem;

  get diagnostics n = row_count;
  return n;
end;
$$;

comment on function public.replace_media_caption_segments(uuid, uuid, uuid, text, uuid, jsonb) is
  'AIS-MEM-016 atomic caption re-index; binds media to the caller project and rolls back if insert fails.';

revoke all on function public.replace_media_caption_segments(uuid, uuid, uuid, text, uuid, jsonb)
  from public, anon;
grant execute on function public.replace_media_caption_segments(uuid, uuid, uuid, text, uuid, jsonb)
  to authenticated, service_role;
