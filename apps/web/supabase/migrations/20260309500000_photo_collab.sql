-- Photo annotations and comments (Phase 6.6). Conflict-free: annotations use version; comments append-only.

create table if not exists public.photo_annotations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  media_id uuid not null,
  author_user_id uuid not null,
  type text not null,
  data jsonb not null,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photo_comments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  media_id uuid not null,
  author_user_id uuid not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_photo_annotations_media on public.photo_annotations(tenant_id, media_id);
create index if not exists idx_photo_comments_media on public.photo_comments(tenant_id, media_id);

alter table public.photo_annotations enable row level security;
alter table public.photo_comments enable row level security;

create policy photo_annotations_tenant on public.photo_annotations for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);
create policy photo_comments_tenant on public.photo_comments for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);
