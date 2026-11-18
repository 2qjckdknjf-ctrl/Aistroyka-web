-- AIS-MEM-016 thin slice: lexical caption/transcript segment index.
-- Timecoded text for contractor-internal search. No customer/portal exposure.
-- Revoke/delete of source media should cascade; no auto Graph completion claims.

create table if not exists public.media_caption_segments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  media_id uuid not null references public.media (id) on delete cascade,
  source_kind text not null default 'transcription'
    check (source_kind in ('transcription', 'caption', 'manual')),
  segment_index integer not null check (segment_index >= 0),
  start_ms integer check (start_ms is null or start_ms >= 0),
  end_ms integer check (end_ms is null or end_ms >= 0),
  text text not null check (char_length(text) between 1 and 4000),
  language text check (language is null or char_length(language) between 2 and 16),
  clock_uncertainty text not null default 'unknown'
    check (clock_uncertainty in ('exact', 'estimated', 'unknown')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, media_id, source_kind, segment_index)
);

create index if not exists media_caption_segments_project_idx
  on public.media_caption_segments (tenant_id, project_id, created_at desc);

create index if not exists media_caption_segments_media_idx
  on public.media_caption_segments (tenant_id, media_id, segment_index);

comment on table public.media_caption_segments is
  'AIS-MEM-016 lexical caption/transcript segments; contractor-internal search only.';

alter table public.media_caption_segments enable row level security;

revoke all on table public.media_caption_segments from public, anon;
grant select, insert, delete on table public.media_caption_segments to authenticated;
grant all on table public.media_caption_segments to service_role;

drop policy if exists media_caption_segments_select on public.media_caption_segments;
create policy media_caption_segments_select on public.media_caption_segments
  for select using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists media_caption_segments_insert on public.media_caption_segments;
create policy media_caption_segments_insert on public.media_caption_segments
  for insert with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists media_caption_segments_delete on public.media_caption_segments;
create policy media_caption_segments_delete on public.media_caption_segments
  for delete using (public.is_internal_tenant_writer_for_tenant(tenant_id));
