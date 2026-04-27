-- Wave 4 Step 13: construction punch list / defects (not a generic company issue tracker).

create table if not exists public.project_defects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open' check (status in (
    'open',
    'in_progress',
    'ready_for_verification',
    'resolved',
    'closed'
  )),
  is_blocking boolean not null default false,
  assigned_to uuid references auth.users(id) on delete set null,
  due_date date,
  resolution_note text,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  linked_milestone_id uuid references public.project_milestones(id) on delete set null,
  linked_document_id uuid references public.project_documents(id) on delete set null,
  linked_discussion_id uuid references public.project_stakeholder_discussions(id) on delete set null,
  linked_request_id uuid references public.project_client_requests(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_defects_project
  on public.project_defects(tenant_id, project_id, updated_at desc);
create index if not exists idx_project_defects_blocking_open
  on public.project_defects(project_id, is_blocking, status)
  where is_blocking = true and status not in ('resolved', 'closed');

comment on table public.project_defects is
  'Punch list / defects (Wave 4 Step 13); distinct from project_issues.';

create table if not exists public.project_defect_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  defect_id uuid not null references public.project_defects(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_defect_events_defect
  on public.project_defect_events(defect_id, created_at asc);

alter table public.project_defects enable row level security;
alter table public.project_defect_events enable row level security;

create policy project_defects_select on public.project_defects
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or public.is_portal_stakeholder_for_project(project_id)
  );

create policy project_defects_write_internal on public.project_defects
  for all using (public.is_internal_tenant_reader_for_tenant(tenant_id))
  with check (public.is_internal_tenant_reader_for_tenant(tenant_id));

-- Stakeholders may report a new open defect (unassigned); team manages thereafter via internal policies.
create policy project_defects_insert_portal on public.project_defects
  for insert with check (
    public.is_portal_stakeholder_for_project(project_id)
    and created_by = (select auth.uid())
    and status = 'open'
    and assigned_to is null
  );

create policy project_defect_events_select on public.project_defect_events
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or public.is_portal_stakeholder_for_project(project_id)
  );

create policy project_defect_events_insert_internal on public.project_defect_events
  for insert with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
  );
