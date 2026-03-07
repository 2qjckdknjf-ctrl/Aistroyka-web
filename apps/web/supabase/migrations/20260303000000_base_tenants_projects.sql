-- Base schema: tenants, tenant_members, projects. Required by all later migrations.
-- Compatible with 20260304000200 (tenants.plan) and tenant.context (tenants.user_id, tenant_members.role).

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text,
  plan text not null default 'FREE' check (plan in ('FREE', 'PRO', 'ENTERPRISE')),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null
);
create unique index if not exists idx_tenants_user_id on public.tenants(user_id) where user_id is not null;
alter table public.tenants enable row level security;
create policy "tenants_select_own_or_member" on public.tenants for select using (
  id in (select tenant_id from public.tenant_members where user_id = auth.uid()) or user_id = auth.uid()
);
create policy "tenants_insert_service" on public.tenants for insert with check (true);
create policy "tenants_update_service" on public.tenants for update using (true);

create table if not exists public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  unique(tenant_id, user_id)
);
create index if not exists idx_tenant_members_tenant_id on public.tenant_members(tenant_id);
create index if not exists idx_tenant_members_user_id on public.tenant_members(user_id);
alter table public.tenant_members enable row level security;
create policy "tenant_members_select_own" on public.tenant_members for select using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid()) or user_id = auth.uid()
);
create policy "tenant_members_insert_service" on public.tenant_members for insert with check (true);
create policy "tenant_members_update_service" on public.tenant_members for update using (true);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_projects_tenant_id on public.projects(tenant_id);
alter table public.projects enable row level security;
create policy "projects_tenant" on public.projects for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);
create policy "projects_insert_service" on public.projects for insert with check (true);
create policy "projects_update_service" on public.projects for update using (true);
