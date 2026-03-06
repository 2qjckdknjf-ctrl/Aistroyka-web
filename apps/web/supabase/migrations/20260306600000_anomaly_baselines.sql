-- Anomaly detection baselines and anomalies (Phase 6.4).

create table if not exists public.baselines_daily (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  metric text not null,
  date date not null,
  value numeric not null,
  primary key (tenant_id, metric, date)
);

create table if not exists public.anomalies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  type text not null,
  metric text not null,
  observed numeric not null,
  expected numeric not null,
  details jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_anomalies_tenant_created on public.anomalies(tenant_id, created_at desc);

alter table public.baselines_daily enable row level security;
alter table public.anomalies enable row level security;

create policy baselines_admin on public.baselines_daily for select using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role in ('owner','admin'))
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);
create policy anomalies_admin on public.anomalies for select using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role in ('owner','admin'))
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);
create policy anomalies_insert on public.anomalies for insert with check (false);
