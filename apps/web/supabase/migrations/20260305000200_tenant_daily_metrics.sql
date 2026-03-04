-- Minimal operational metrics per tenant per day. Backfill or write from job processor / ai usage.
create table if not exists public.tenant_daily_metrics (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  date date not null,
  ai_calls int not null default 0,
  ai_cost_usd numeric(12,6) not null default 0,
  jobs_processed int not null default 0,
  jobs_failed int not null default 0,
  uploads int not null default 0,
  active_workers int not null default 0,
  primary key (tenant_id, date)
);

alter table public.tenant_daily_metrics enable row level security;
create policy tenant_daily_metrics_admin on public.tenant_daily_metrics for select using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role in ('owner','admin'))
);
