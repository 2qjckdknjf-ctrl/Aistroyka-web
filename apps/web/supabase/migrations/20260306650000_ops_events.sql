-- Ops events for metrics: sync_conflict and other operational signals. Tenant-scoped.
create table if not exists public.ops_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  type text not null,
  created_at timestamptz not null default now(),
  metadata jsonb default '{}'
);

create index if not exists idx_ops_events_tenant_type_created
  on public.ops_events(tenant_id, type, created_at);

alter table public.ops_events enable row level security;

create policy ops_events_select on public.ops_events for select using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);

create policy ops_events_insert on public.ops_events for insert with check (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);
