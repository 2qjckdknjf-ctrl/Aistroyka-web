-- Wave 4 Step 12: project handover / completion (not warranty platform, not giant checklist engine).

create table if not exists public.project_handover (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null default 'in_progress' check (status in (
    'in_progress',
    'handover_ready',
    'handed_over',
    'completed'
  )),
  handover_notes text,
  handed_over_at timestamptz,
  handed_over_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id)
);

create index if not exists idx_project_handover_tenant on public.project_handover(tenant_id);

comment on table public.project_handover is
  'Project-level handover/completion state (Wave 4 Step 12); readiness is computed in application code.';

create table if not exists public.project_handover_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  handover_id uuid not null references public.project_handover(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_handover_events_handover
  on public.project_handover_events(handover_id, created_at asc);

alter table public.project_handover enable row level security;
alter table public.project_handover_events enable row level security;

create policy project_handover_select on public.project_handover
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or public.is_portal_stakeholder_for_project(project_id)
  );

create policy project_handover_write_internal on public.project_handover
  for all using (public.is_internal_tenant_reader_for_tenant(tenant_id))
  with check (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy project_handover_events_select on public.project_handover_events
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or public.is_portal_stakeholder_for_project(project_id)
  );

create policy project_handover_events_insert_internal on public.project_handover_events
  for insert with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
  );
