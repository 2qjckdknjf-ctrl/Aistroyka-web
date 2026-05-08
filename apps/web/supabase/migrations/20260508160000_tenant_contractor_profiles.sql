-- Phase 11: internal contractor directory (profiles + manager-only UI). Not exposed to customer portal.

create table if not exists public.tenant_contractor_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null default '',
  specializations text[] not null default '{}',
  phone text not null default '',
  email text not null default '',
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index if not exists idx_tenant_contractor_profiles_tenant
  on public.tenant_contractor_profiles(tenant_id);

create index if not exists idx_tenant_contractor_profiles_specs
  on public.tenant_contractor_profiles using gin (specializations);

comment on table public.tenant_contractor_profiles is
  'Internal contractor directory card (Phase 11). Quality metrics computed from tasks/reports; not shown to customers.';

alter table public.tenant_contractor_profiles enable row level security;

create policy tenant_contractor_profiles_internal_rw on public.tenant_contractor_profiles
  for all using (public.is_internal_tenant_reader_for_tenant(tenant_id))
  with check (public.is_internal_tenant_reader_for_tenant(tenant_id));
