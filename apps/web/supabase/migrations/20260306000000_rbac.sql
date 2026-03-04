-- RBAC: roles, permissions, role_permissions, user_scopes.
-- Tenant DB roles (owner|admin|member|viewer) map to enterprise roles (OWNER|MANAGER|WORKER|CONTRACTOR).

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.user_scopes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null,
  scope text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_scopes_tenant_user on public.user_scopes(tenant_id, user_id);

-- Seed roles (enterprise names)
insert into public.roles (id, name) values
  ('00000000-0000-0000-0000-000000000001', 'OWNER'),
  ('00000000-0000-0000-0000-000000000002', 'MANAGER'),
  ('00000000-0000-0000-0000-000000000003', 'WORKER'),
  ('00000000-0000-0000-0000-000000000004', 'CONTRACTOR')
on conflict (name) do nothing;

-- Seed permissions
insert into public.permissions (id, key) values
  ('10000000-0000-0000-0000-000000000001', 'read'),
  ('10000000-0000-0000-0000-000000000002', 'write'),
  ('10000000-0000-0000-0000-000000000003', 'create'),
  ('10000000-0000-0000-0000-000000000004', 'delete'),
  ('10000000-0000-0000-0000-000000000005', 'approve'),
  ('10000000-0000-0000-0000-000000000006', 'assign'),
  ('10000000-0000-0000-0000-000000000007', 'invite'),
  ('10000000-0000-0000-0000-000000000008', 'export'),
  ('10000000-0000-0000-0000-000000000009', 'billing_admin'),
  ('10000000-0000-0000-0000-000000000010', 'ai_admin')
on conflict (key) do nothing;

-- OWNER: all
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p where r.name = 'OWNER'
on conflict do nothing;

-- MANAGER: all except billing_admin (or include for org)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'MANAGER' and p.key in ('read','write','create','delete','approve','assign','invite','export','ai_admin')
on conflict do nothing;

-- WORKER: read, write, create (own reports/tasks)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'WORKER' and p.key in ('read','write','create')
on conflict do nothing;

-- CONTRACTOR: read
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'CONTRACTOR' and p.key = 'read'
on conflict (role_id, permission_id) do nothing;

alter table public.user_scopes enable row level security;
create policy user_scopes_tenant on public.user_scopes for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
