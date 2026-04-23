-- Wave 4 Step 3: append-only document lifecycle events (tenant-visible).
-- audit_logs SELECT is restricted to owner/admin; managers need full history.

create table if not exists public.project_document_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  document_id uuid not null references public.project_documents(id) on delete cascade,
  event_type text not null check (event_type in (
    'created',
    'file_uploaded',
    'submitted_for_review',
    'approved',
    'rejected',
    'changes_requested',
    'resubmitted',
    'archived'
  )),
  actor_user_id uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_document_events_document on public.project_document_events(document_id, created_at);
create index if not exists idx_project_document_events_tenant on public.project_document_events(tenant_id, created_at desc);

comment on table public.project_document_events is 'Append-only governance log for project documents (acts, contracts, generic).';

alter table public.project_document_events enable row level security;

drop policy if exists project_document_events_select on public.project_document_events;
create policy project_document_events_select on public.project_document_events for select using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

drop policy if exists project_document_events_insert on public.project_document_events;
create policy project_document_events_insert on public.project_document_events for insert with check (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
