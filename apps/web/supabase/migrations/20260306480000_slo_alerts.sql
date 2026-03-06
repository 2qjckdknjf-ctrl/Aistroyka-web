-- SLO daily stats and alerts (Phase 4.5).

create table if not exists public.slo_daily (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  date date not null,
  endpoint_group text not null,
  requests int not null default 0,
  errors int not null default 0,
  p95_latency_ms int,
  primary key (tenant_id, date, endpoint_group)
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  severity text not null check (severity in ('info', 'warn', 'critical')),
  type text not null,
  message text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_alerts_tenant_created on public.alerts(tenant_id, created_at desc);
create index if not exists idx_alerts_unresolved on public.alerts(tenant_id, resolved_at) where resolved_at is null;

alter table public.slo_daily enable row level security;
alter table public.alerts enable row level security;

create policy slo_daily_admin on public.slo_daily for select using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role in ('owner','admin'))
);
create policy alerts_admin on public.alerts for select using (
  tenant_id is null or tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role in ('owner','admin'))
);
