-- Phase 7.6: extend worker_tasks for manager console (description, required_photos, report_required, cancelled).
alter table public.worker_tasks
  add column if not exists description text,
  add column if not exists required_photos jsonb not null default '{}',
  add column if not exists report_required boolean not null default true;

alter table public.worker_tasks
  drop constraint if exists worker_tasks_status_check;

alter table public.worker_tasks
  add constraint worker_tasks_status_check
  check (status in ('pending', 'in_progress', 'done', 'cancelled'));

comment on column public.worker_tasks.required_photos is 'e.g. {"before":1,"after":1} for photo requirements';
comment on column public.worker_tasks.report_required is 'Whether a report is required to complete the task';
