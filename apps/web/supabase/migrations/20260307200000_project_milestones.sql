-- Step 10: Project milestones for schedule layer.
-- Minimal model: milestone entity, target date, status, task linkage.

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  description text,
  target_date date not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done', 'cancelled')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_milestones_project on public.project_milestones(project_id);
create index if not exists idx_project_milestones_tenant on public.project_milestones(tenant_id);
create index if not exists idx_project_milestones_target on public.project_milestones(project_id, target_date);

alter table public.project_milestones enable row level security;

create policy project_milestones_tenant on public.project_milestones for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);

-- Task-milestone association: add milestone_id to worker_tasks
alter table public.worker_tasks
  add column if not exists milestone_id uuid references public.project_milestones(id) on delete set null;

create index if not exists idx_worker_tasks_milestone on public.worker_tasks(milestone_id);

comment on table public.project_milestones is 'Delivery checkpoints for project schedule';
comment on column public.project_milestones.target_date is 'Target completion date';
comment on column public.worker_tasks.milestone_id is 'Optional link to project milestone';
