-- Step 12: Project documents (acts, contracts, generic documents).
-- Reuses media bucket for storage; object_path stores file reference.

create table if not exists public.project_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  type text not null check (type in ('document', 'act', 'contract')),
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'uploaded', 'under_review', 'approved', 'rejected', 'archived')),
  object_path text,
  created_by uuid references auth.users(id) on delete set null,
  report_id uuid references public.worker_reports(id) on delete set null,
  task_id uuid references public.worker_tasks(id) on delete set null,
  milestone_id uuid references public.project_milestones(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_documents_project on public.project_documents(project_id);
create index if not exists idx_project_documents_tenant on public.project_documents(tenant_id);
create index if not exists idx_project_documents_status on public.project_documents(status) where status in ('under_review', 'uploaded');

alter table public.project_documents enable row level security;
create policy project_documents_tenant on public.project_documents for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);

create or replace function public.set_project_documents_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
create trigger project_documents_updated_at before update on public.project_documents
  for each row execute function public.set_project_documents_updated_at();

comment on table public.project_documents is 'Project-level formal documents: acts, contracts, generic documents.';
comment on column public.project_documents.type is 'document | act | contract';
comment on column public.project_documents.status is 'draft | uploaded | under_review | approved | rejected | archived';
comment on column public.project_documents.object_path is 'Storage path in media bucket';
