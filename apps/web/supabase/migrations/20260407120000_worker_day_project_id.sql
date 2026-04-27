-- Wave 4 Step 19 closure: real FK for project-scoped worker days (report traceability via worker_reports.day_id).
-- Aligns schema with report-list.repository and countSubmittedReportsForProject.

alter table public.worker_day
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists idx_worker_day_tenant_project
  on public.worker_day(tenant_id, project_id)
  where project_id is not null;

comment on column public.worker_day.project_id is
  'Optional project context for the worker day; enables linking worker_reports.day_id to a project for approvals and traceability.';
