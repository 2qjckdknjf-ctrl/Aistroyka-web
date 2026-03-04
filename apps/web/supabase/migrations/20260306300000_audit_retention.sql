-- Audit logs and data retention policies (Phase 3.4).

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid,
  trace_id text,
  action text not null,
  resource_type text,
  resource_id text,
  details jsonb default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_logs_tenant_created on public.audit_logs(tenant_id, created_at desc);
create index if not exists idx_audit_logs_action on public.audit_logs(tenant_id, action, created_at desc);

create table if not exists public.data_retention_policies (
  tenant_id uuid not null references public.tenants(id) on delete cascade primary key,
  media_retention_days int,
  report_retention_days int,
  ai_usage_retention_days int,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;
alter table public.data_retention_policies enable row level security;

create policy audit_logs_tenant_admin on public.audit_logs for select using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role in ('owner','admin'))
);
create policy audit_logs_insert on public.audit_logs for insert with check (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
create policy data_retention_tenant_admin on public.data_retention_policies for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role in ('owner','admin'))
);
