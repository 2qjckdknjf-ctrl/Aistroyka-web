-- Add 'owner' role to project_members and backfill membership for existing projects.
-- After this: project_members is canonical for project access.

-- 1. Extend role check to include 'owner'
alter table public.project_members drop constraint if exists project_members_role_check;
alter table public.project_members add constraint project_members_role_check
  check (role in ('worker', 'contractor', 'manager', 'owner'));

-- 2. Backfill: add project_members for tenant owner/admin/member on all projects.
-- Tenant owner gets role=owner; admin/member get role=manager.
-- Skip if row already exists (worker/contractor keep their role).
insert into public.project_members (tenant_id, project_id, user_id, role, status)
select p.tenant_id, p.id, tm.user_id,
  case when t.user_id = tm.user_id then 'owner' else 'manager' end,
  'active'
from public.projects p
join public.tenants t on t.id = p.tenant_id
join public.tenant_members tm on tm.tenant_id = p.tenant_id and tm.role in ('owner', 'admin', 'member')
where not exists (
  select 1 from public.project_members pm
  where pm.tenant_id = p.tenant_id and pm.project_id = p.id and pm.user_id = tm.user_id
)
on conflict (tenant_id, project_id, user_id) do nothing;

-- 3. Tenant owner (tenants.user_id) who may not be in tenant_members yet
insert into public.project_members (tenant_id, project_id, user_id, role, status)
select p.tenant_id, p.id, t.user_id, 'owner', 'active'
from public.projects p
join public.tenants t on t.id = p.tenant_id
where t.user_id is not null
and not exists (
  select 1 from public.project_members pm
  where pm.tenant_id = p.tenant_id and pm.project_id = p.id and pm.user_id = t.user_id
)
on conflict (tenant_id, project_id, user_id) do update set role = 'owner', status = 'active';
