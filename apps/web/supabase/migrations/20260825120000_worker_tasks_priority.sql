-- Manager-set operational priority for worker_tasks (low/medium/high).
alter table public.worker_tasks
  add column if not exists priority text not null default 'medium';

alter table public.worker_tasks
  drop constraint if exists worker_tasks_priority_check;

alter table public.worker_tasks
  add constraint worker_tasks_priority_check
  check (priority in ('low', 'medium', 'high'));

comment on column public.worker_tasks.priority is 'Manager-set operational priority: low, medium, high';
