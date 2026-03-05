-- Phase 4.7: Data residency foundation (metadata only)
create table if not exists tenant_settings (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  data_residency text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table tenant_settings is 'Tenant data residency preference (EU/US/default).';
create index if not exists idx_tenant_settings_data_residency on tenant_settings(data_residency) where data_residency is not null;
