-- A caption replacement is one transaction, bound to its media/project/tenant.
-- Authenticated writes must use this RPC so an insert failure cannot erase the
-- previous index and concurrent replacements cannot interleave their segments.
revoke insert, update, delete, truncate, references, trigger
  on public.media_caption_segments from authenticated;
drop policy if exists media_caption_segments_insert on public.media_caption_segments;
drop policy if exists media_caption_segments_delete on public.media_caption_segments;

drop policy if exists media_caption_segments_select on public.media_caption_segments;
create policy media_caption_segments_select on public.media_caption_segments
  for select to authenticated
  using (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and app_private.customer_intake_tenant_account_active(tenant_id)
    and exists (
      select 1 from public.media m
      join public.projects p on p.id = m.project_id and p.tenant_id = m.tenant_id
      where m.id = media_caption_segments.media_id
        and m.tenant_id = media_caption_segments.tenant_id
        and m.project_id = media_caption_segments.project_id
    )
  );

create or replace function public.replace_media_caption_segments(
  p_tenant_id uuid,
  p_project_id uuid,
  p_media_id uuid,
  p_actor_user_id uuid,
  p_source_kind text,
  p_segments jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  inserted integer;
begin
  if actor is null or p_actor_user_id is distinct from actor
     or not public.is_tenant_owner_or_admin(p_tenant_id)
     or not app_private.customer_intake_tenant_account_active(p_tenant_id) then
    raise exception 'Insufficient rights' using errcode = '42501';
  end if;

  if p_source_kind is null or p_source_kind not in ('transcription', 'caption', 'manual')
     or p_segments is null or jsonb_typeof(p_segments) <> 'array' then
    raise exception 'Invalid caption payload' using errcode = '22023';
  end if;
  if jsonb_array_length(p_segments) not between 1 and 2000 then
    raise exception 'Invalid caption payload' using errcode = '22023';
  end if;

  -- Lock the parent before deleting any rows. Every source for the same media
  -- serializes through this lock, including an initially empty index.
  perform m.id
  from public.media m
  join public.projects p on p.id = m.project_id and p.tenant_id = m.tenant_id
  where m.id = p_media_id and m.tenant_id = p_tenant_id and m.project_id = p_project_id
  for update of m;
  if not found then
    raise exception 'Media scope mismatch' using errcode = 'P0002';
  end if;

  -- Deliberately remove any legacy mis-scoped rows for this authorized media,
  -- allowing a valid re-index to repair them without moving another media.
  delete from public.media_caption_segments
  where tenant_id = p_tenant_id and media_id = p_media_id and source_kind = p_source_kind;

  insert into public.media_caption_segments (
    tenant_id, project_id, media_id, source_kind, segment_index,
    start_ms, end_ms, text, language, clock_uncertainty, created_by
  )
  select p_tenant_id, p_project_id, p_media_id, p_source_kind, (s.ordinality - 1)::integer,
    (s.value ->> 'start_ms')::integer, (s.value ->> 'end_ms')::integer,
    btrim(s.value ->> 'text'), nullif(btrim(s.value ->> 'language'), ''),
    coalesce(s.value ->> 'clock_uncertainty', 'unknown'), actor
  from jsonb_array_elements(p_segments) with ordinality as s(value, ordinality);
  get diagnostics inserted = row_count;
  if inserted <> jsonb_array_length(p_segments) then
    -- A BEFORE INSERT trigger may suppress a row without raising an error.
    -- Treat any incomplete replacement as a failure inside the transaction.
    raise exception 'Caption replacement was incomplete' using errcode = 'P0001';
  end if;
  return inserted;
end;
$$;

revoke all on function public.replace_media_caption_segments(uuid, uuid, uuid, uuid, text, jsonb)
  from public, anon, service_role;
grant execute on function public.replace_media_caption_segments(uuid, uuid, uuid, uuid, text, jsonb)
  to authenticated;

comment on function public.replace_media_caption_segments(uuid, uuid, uuid, uuid, text, jsonb) is
  'Owner/admin atomic caption replacement; verifies active account, caller identity and media/project/tenant binding.';

notify pgrst, 'reload schema';
