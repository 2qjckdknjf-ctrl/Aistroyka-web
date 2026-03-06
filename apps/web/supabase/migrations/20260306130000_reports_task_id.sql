-- Phase 7.6: link reports to tasks server-side. Optional task_id; RLS unchanged (tenant-scoped).

alter table public.worker_reports
  add column if not exists task_id uuid references public.worker_tasks(id) on delete set null;

create index if not exists idx_worker_reports_tenant_task on public.worker_reports(tenant_id, task_id) where task_id is not null;
create index if not exists idx_worker_reports_task on public.worker_reports(task_id) where task_id is not null;

comment on column public.worker_reports.task_id is 'Optional link to worker_tasks; worker may set only if task is assigned to them.';
