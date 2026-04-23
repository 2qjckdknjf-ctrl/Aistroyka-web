-- Core workflow: project issues (defects, observations) for operational loop.
-- Status: open, in_review, resolved, closed.

create table if not exists public.project_issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved', 'closed')),
  task_id uuid references public.worker_tasks(id) on delete set null,
  milestone_id uuid references public.project_milestones(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_issues_project on public.project_issues(project_id);
create index if not exists idx_project_issues_tenant on public.project_issues(tenant_id);
create index if not exists idx_project_issues_status on public.project_issues(status) where status in ('open', 'in_review');
create index if not exists idx_project_issues_task on public.project_issues(task_id) where task_id is not null;

alter table public.project_issues enable row level security;

create policy project_issues_tenant_member on public.project_issues for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);

create or replace function public.set_project_issues_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger project_issues_updated_at before update on public.project_issues
  for each row execute function public.set_project_issues_updated_at();

comment on table public.project_issues is 'Project defects/observations for core execution workflow. Status: open, in_review, resolved, closed.';
