-- Privacy/PII classification and policy (Phase 6.3).

create table if not exists public.privacy_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  pii_mode text not null check (pii_mode in ('off', 'detect', 'enforce')),
  redact_ai_prompts boolean not null default true,
  allow_exports boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.pii_findings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  resource_type text not null,
  resource_id uuid not null,
  pii_level text not null check (pii_level in ('none', 'low', 'medium', 'high')),
  types text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_pii_findings_tenant_created on public.pii_findings(tenant_id, created_at desc);

alter table public.privacy_settings enable row level security;
alter table public.pii_findings enable row level security;

create policy privacy_settings_tenant_admin on public.privacy_settings for select using (
  tenant_id in (select id from public.tenants where user_id = auth.uid())
  or tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role in ('owner','admin'))
);
create policy pii_findings_tenant_admin on public.pii_findings for select using (
  tenant_id in (select id from public.tenants where user_id = auth.uid())
  or tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role in ('owner','admin'))
);

create policy privacy_settings_admin on public.privacy_settings for all using (false);
create policy pii_findings_insert on public.pii_findings for insert with check (false);
