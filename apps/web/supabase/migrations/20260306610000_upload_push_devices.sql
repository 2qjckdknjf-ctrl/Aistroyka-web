-- Upload session extensions (background, chunks) and push (device_tokens, push_outbox) (Phase 6.5).

alter table public.upload_sessions
  add column if not exists checksum text,
  add column if not exists chunks_expected int,
  add column if not exists chunks_received int,
  add column if not exists background_hint boolean default false,
  add column if not exists last_client_ts timestamptz;

create table if not exists public.device_tokens (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null,
  device_id text not null,
  platform text not null check (platform in ('ios', 'android')),
  token text not null,
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id, device_id)
);

create table if not exists public.push_outbox (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null,
  platform text not null,
  type text not null,
  payload jsonb,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_outbox_status on public.push_outbox(status) where status = 'queued';

alter table public.device_tokens enable row level security;
alter table public.push_outbox enable row level security;

create policy device_tokens_own on public.device_tokens for all using (
  (tenant_id, user_id) in (select tenant_id, user_id from public.tenant_members where user_id = auth.uid())
  or (tenant_id in (select id from public.tenants where user_id = auth.uid()))
);
create policy push_outbox_tenant on public.push_outbox for select using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role in ('owner','admin'))
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);
create policy push_outbox_insert on public.push_outbox for insert with check (false);
