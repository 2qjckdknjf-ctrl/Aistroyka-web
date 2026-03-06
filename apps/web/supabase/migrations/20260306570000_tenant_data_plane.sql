-- Multi-region / tenant sharding foundation (Phase 6.1). One data plane for now.

create table if not exists public.tenant_data_plane (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  region text not null check (region in ('eu', 'us', 'me', 'apac')),
  shard text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_tenant_data_plane_region on public.tenant_data_plane(region);
create index if not exists idx_tenant_data_plane_shard on public.tenant_data_plane(shard);

alter table public.tenant_data_plane enable row level security;

create policy tenant_data_plane_read on public.tenant_data_plane for select using (
  tenant_id in (select id from public.tenants where user_id = auth.uid())
  or tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

-- Writes via service_role (admin / provisioning).
create policy tenant_data_plane_admin on public.tenant_data_plane for all using (false);
