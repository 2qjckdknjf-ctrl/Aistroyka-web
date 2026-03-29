-- Wave 4 Step 5: Client / customer visibility — exposure flags (manager-controlled).

alter table public.projects
  add column if not exists client_portal_enabled boolean not null default false,
  add column if not exists client_show_budget_summary boolean not null default false;

comment on column public.projects.client_portal_enabled is 'When true, project owners may use the client portal read model for this project.';
comment on column public.projects.client_show_budget_summary is 'When true, client portal may show high-level planned vs actual totals only (no line items).';

alter table public.project_milestones
  add column if not exists client_visible boolean not null default false;

comment on column public.project_milestones.client_visible is 'When true and client portal enabled, milestone appears in client view.';

alter table public.project_documents
  add column if not exists client_visible boolean not null default false;

comment on column public.project_documents.client_visible is 'When true and client portal enabled, document metadata appears in client view (no file URL in API).';
