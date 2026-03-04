-- Project-level membership and task assignments (Phase 3.2).
-- Worker/contractor access is project-scoped; task visibility is by assignment.

-- project_members: who can access which project (worker|contractor|manager).
create table if not exists public.project_members (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('worker', 'contractor', 'manager')),
  status text not null default 'active' check (status in ('active', 'inactive', 'removed')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, project_id, user_id)
);
create index if not exists idx_project_members_tenant_user on public.project_members(tenant_id, user_id);
create index if not exists idx_project_members_project on public.project_members(project_id);

-- task_assignments: canonical assignment of tasks to users.
create table if not exists public.task_assignments (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  task_id uuid not null references public.worker_tasks(id) on delete cascade,
  user_id uuid not null,
  assigned_by uuid,
  assigned_at timestamptz not null default now(),
  primary key (tenant_id, task_id, user_id)
);
create index if not exists idx_task_assignments_tenant_user on public.task_assignments(tenant_id, user_id);

alter table public.project_members enable row level security;
alter table public.task_assignments enable row level security;

create policy project_members_tenant on public.project_members for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
create policy task_assignments_tenant on public.task_assignments for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
