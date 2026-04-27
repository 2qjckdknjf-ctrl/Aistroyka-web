-- Wave 4 Step 14: post-handover warranty / aftercare service requests (not a generic helpdesk).

create table if not exists public.project_service_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'reported' check (status in (
    'reported',
    'triaged',
    'in_progress',
    'resolved',
    'closed'
  )),
  coverage_type text not null default 'warranty_review_needed' check (coverage_type in (
    'warranty_covered',
    'warranty_review_needed',
    'not_warranty'
  )),
  assigned_to uuid references auth.users(id) on delete set null,
  due_date date,
  resolution_note text,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  linked_handover_id uuid references public.project_handover(id) on delete set null,
  linked_defect_id uuid references public.project_defects(id) on delete set null,
  linked_discussion_id uuid references public.project_stakeholder_discussions(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_service_requests_project
  on public.project_service_requests(tenant_id, project_id, updated_at desc);

comment on table public.project_service_requests is
  'Post-handover warranty/aftercare requests (Wave 4 Step 14); not a company-wide ticket system.';

create table if not exists public.project_service_request_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  service_request_id uuid not null references public.project_service_requests(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_service_request_events_req
  on public.project_service_request_events(service_request_id, created_at asc);

alter table public.project_service_requests enable row level security;
alter table public.project_service_request_events enable row level security;

create policy project_service_requests_select on public.project_service_requests
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or public.is_portal_stakeholder_for_project(project_id)
  );

create policy project_service_requests_write_internal on public.project_service_requests
  for all using (public.is_internal_tenant_reader_for_tenant(tenant_id))
  with check (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy project_service_requests_insert_portal on public.project_service_requests
  for insert with check (
    public.is_portal_stakeholder_for_project(project_id)
    and created_by = (select auth.uid())
    and status = 'reported'
    and coverage_type = 'warranty_review_needed'
    and assigned_to is null
  );

create policy project_service_request_events_select on public.project_service_request_events
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or public.is_portal_stakeholder_for_project(project_id)
  );

create policy project_service_request_events_insert_internal on public.project_service_request_events
  for insert with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
  );
