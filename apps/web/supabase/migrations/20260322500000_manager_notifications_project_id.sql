-- Add project_id for deep-link routing (issue, document, etc.).

alter table public.manager_notifications
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists idx_manager_notifications_project
  on public.manager_notifications(project_id) where project_id is not null;

comment on column public.manager_notifications.project_id is 'Project context for deep-link (issue, document routes).';
