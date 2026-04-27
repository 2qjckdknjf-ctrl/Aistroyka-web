-- Wave 4 Step 20 — cross-project governance / escalation (not generic ticketing).

create table if not exists public.governance_cases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  rationale text,
  status text not null default 'open' check (status in (
    'open',
    'under_review',
    'decision_required',
    'decided',
    'resolved',
    'archived'
  )),
  severity text not null default 'medium' check (severity in ('medium', 'high', 'critical')),
  decision_required text not null,
  decision_outcome text,
  created_by uuid not null references auth.users(id) on delete restrict,
  owned_by uuid references auth.users(id) on delete set null,
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_governance_cases_tenant_status
  on public.governance_cases(tenant_id, status, updated_at desc);

comment on table public.governance_cases is
  'Cross-project governance / escalation cases (Wave 4 Step 20); internal workspace, auditable.';

create table if not exists public.governance_case_projects (
  governance_case_id uuid not null references public.governance_cases(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  note text,
  primary key (governance_case_id, project_id)
);

create index if not exists idx_governance_case_projects_project
  on public.governance_case_projects(tenant_id, project_id);

comment on table public.governance_case_projects is
  'Projects affected by a governance case; tenant-scoped join.';

create table if not exists public.governance_case_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  governance_case_id uuid not null references public.governance_cases(id) on delete cascade,
  event_kind text not null check (event_kind in ('created', 'status_change', 'decision_recorded', 'updated')),
  from_status text,
  to_status text,
  decision_outcome text,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_governance_case_events_case
  on public.governance_case_events(governance_case_id, created_at asc);

comment on table public.governance_case_events is
  'Append-only audit trail for governance case lifecycle.';

alter table public.governance_cases enable row level security;
alter table public.governance_case_projects enable row level security;
alter table public.governance_case_events enable row level security;

create policy governance_cases_select on public.governance_cases
  for select using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy governance_cases_write on public.governance_cases
  for all using (public.is_internal_tenant_reader_for_tenant(tenant_id))
  with check (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy governance_case_projects_select on public.governance_case_projects
  for select using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy governance_case_projects_write on public.governance_case_projects
  for all using (public.is_internal_tenant_reader_for_tenant(tenant_id))
  with check (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy governance_case_events_select on public.governance_case_events
  for select using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy governance_case_events_insert on public.governance_case_events
  for insert with check (public.is_internal_tenant_reader_for_tenant(tenant_id));

create or replace function public.set_governance_cases_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists governance_cases_updated_at on public.governance_cases;
create trigger governance_cases_updated_at
  before update on public.governance_cases
  for each row execute function public.set_governance_cases_updated_at();
