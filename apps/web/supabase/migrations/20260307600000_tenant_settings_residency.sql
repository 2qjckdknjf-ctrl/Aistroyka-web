-- Tenant settings: data residency preference (Phase 4.7). Foundation for future multi-region.

create table if not exists public.tenant_settings (
  tenant_id uuid not null references public.tenants(id) on delete cascade primary key,
  data_residency text,
  created_at timestamptz not null default now()
);

alter table public.tenant_settings enable row level security;

create policy tenant_settings_tenant_admin on public.tenant_settings for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role in ('owner','admin'))
);
