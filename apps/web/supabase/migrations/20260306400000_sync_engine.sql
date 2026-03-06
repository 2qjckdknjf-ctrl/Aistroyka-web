-- Phase 4.1: Offline-first sync engine. Cursor-based delta sync.

create table if not exists public.sync_cursors (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null,
  device_id text not null,
  cursor bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, user_id, device_id)
);

create table if not exists public.change_log (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  resource_type text not null,
  resource_id uuid not null,
  change_type text not null check (change_type in ('created', 'updated', 'deleted')),
  changed_by uuid,
  ts timestamptz not null default now(),
  payload jsonb default '{}'
);

create index if not exists idx_change_log_tenant_id on public.change_log(tenant_id, id);
create index if not exists idx_change_log_ts on public.change_log(tenant_id, ts);

alter table public.sync_cursors enable row level security;
alter table public.change_log enable row level security;

create policy sync_cursors_tenant on public.sync_cursors for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
create policy change_log_tenant_select on public.change_log for select using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
create policy change_log_insert on public.change_log for insert with check (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
