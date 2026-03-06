-- Feature flags and per-tenant overrides (Phase 5.1).
-- Rollout: allowlist_tenant_ids and rollout_percent (hash-based).

create table if not exists public.feature_flags (
  key text primary key,
  description text,
  rollout_percent int check (rollout_percent is null or (rollout_percent >= 0 and rollout_percent <= 100)),
  allowlist_tenant_ids uuid[],
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_feature_flags (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  key text not null references public.feature_flags(key) on delete cascade,
  enabled boolean not null default false,
  variant text,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, key)
);

create index if not exists idx_tenant_feature_flags_tenant on public.tenant_feature_flags(tenant_id);

alter table public.feature_flags enable row level security;
alter table public.tenant_feature_flags enable row level security;

-- All authenticated can read flags (keys/descriptions); tenant_flags only for own tenant.
create policy feature_flags_read on public.feature_flags for select to authenticated using (true);
create policy tenant_feature_flags_read on public.tenant_feature_flags for select using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
    or tenant_id in (select id from public.tenants where user_id = auth.uid())
);

-- Write only via service_role (admin routes use admin client).
create policy feature_flags_admin on public.feature_flags for all using (false);
create policy tenant_feature_flags_admin on public.tenant_feature_flags for all using (false);
