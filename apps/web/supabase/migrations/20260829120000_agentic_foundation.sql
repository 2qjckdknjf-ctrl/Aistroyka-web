-- Agentic Foundation Slice 01: Construction Graph, agent runs, proposed actions.
-- Additive only. Existing tables remain the system of record.
-- Graph rows bind to source entities via (source_type, source_id); they do not replace tasks/issues/reports.

-- ---------------------------------------------------------------------------
-- Feature flag (disabled globally; enable via allowlist / tenant override / env mode)
-- ---------------------------------------------------------------------------
insert into public.feature_flags (key, description, rollout_percent, allowlist_tenant_ids)
values (
  'AGENTIC_FOUNDATION_ENABLED',
  'Construction AI OS foundation: project agent, skill registry, construction graph. Default off (Stage 0).',
  0,
  null
)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Construction Graph (Postgres, tenant + project scoped)
-- ---------------------------------------------------------------------------
create table if not exists public.construction_entities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  entity_type text not null,
  source_type text not null,
  source_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint construction_entities_source_unique unique (tenant_id, project_id, source_type, source_id),
  constraint construction_entities_entity_type_check check (entity_type ~ '^[A-Z][A-Z0-9_]*$'),
  constraint construction_entities_source_type_check check (source_type ~ '^[a-z][a-z0-9_]*$')
);

create index if not exists idx_construction_entities_project
  on public.construction_entities (tenant_id, project_id, entity_type);
create index if not exists idx_construction_entities_source
  on public.construction_entities (tenant_id, source_type, source_id);

comment on table public.construction_entities is
  'Construction Graph nodes. Source of truth remains the bound production table (source_type/source_id).';

create table if not exists public.construction_relations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  from_entity_id uuid not null references public.construction_entities(id) on delete cascade,
  relation_type text not null,
  to_entity_id uuid not null references public.construction_entities(id) on delete cascade,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint construction_relations_unique unique (tenant_id, project_id, from_entity_id, relation_type, to_entity_id),
  constraint construction_relations_type_check check (relation_type ~ '^[A-Z][A-Z0-9_]*$'),
  constraint construction_relations_no_self check (from_entity_id <> to_entity_id)
);

create index if not exists idx_construction_relations_from
  on public.construction_relations (tenant_id, project_id, from_entity_id, relation_type);
create index if not exists idx_construction_relations_to
  on public.construction_relations (tenant_id, project_id, to_entity_id, relation_type);

comment on table public.construction_relations is
  'Construction Graph edges. Traversal must stay within tenant_id + project_id.';

-- ---------------------------------------------------------------------------
-- Agent runs + steps
-- ---------------------------------------------------------------------------
create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  agent_type text not null default 'project_delivery',
  request jsonb not null default '{}'::jsonb,
  status text not null default 'COMPLETED',
  model_provider text,
  model_name text,
  prompt_version text,
  skills_called text[] not null default '{}',
  structured_result jsonb,
  token_usage jsonb,
  latency_ms integer,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  trace_id text,
  error_code text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  constraint agent_runs_status_check check (status in (
    'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXECUTING', 'COMPLETED', 'FAILED', 'CANCELLED'
  )),
  constraint agent_runs_idempotency_unique unique (tenant_id, actor_user_id, idempotency_key)
);

create index if not exists idx_agent_runs_project
  on public.agent_runs (tenant_id, project_id, created_at desc);
create index if not exists idx_agent_runs_trace
  on public.agent_runs (tenant_id, trace_id);

comment on table public.agent_runs is
  'Agentic Foundation runs. Do not store secrets, signed URLs, or raw provider keys.';

create table if not exists public.agent_run_steps (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  agent_run_id uuid not null references public.agent_runs(id) on delete cascade,
  skill text not null,
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  status text not null default 'COMPLETED',
  duration_ms integer,
  evidence_refs jsonb not null default '[]'::jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  constraint agent_run_steps_status_check check (status in ('COMPLETED', 'FAILED', 'DENIED', 'SKIPPED'))
);

create index if not exists idx_agent_run_steps_run
  on public.agent_run_steps (tenant_id, agent_run_id, created_at);

-- ---------------------------------------------------------------------------
-- Proposed agent actions (never auto-executed in Slice 01)
-- ---------------------------------------------------------------------------
create table if not exists public.proposed_agent_actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  agent_run_id uuid not null references public.agent_runs(id) on delete cascade,
  skill_name text not null,
  action_type text not null,
  risk_level text not null,
  payload jsonb not null default '{}'::jsonb,
  reason text,
  expected_effect text,
  approval_required boolean not null default true,
  status text not null default 'PROPOSED',
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint proposed_agent_actions_status_check check (status in (
    'PROPOSED', 'APPROVED', 'REJECTED', 'EXECUTED', 'FAILED', 'EXPIRED'
  )),
  constraint proposed_agent_actions_risk_check check (risk_level in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

create index if not exists idx_proposed_agent_actions_run
  on public.proposed_agent_actions (tenant_id, project_id, agent_run_id);
create index if not exists idx_proposed_agent_actions_status
  on public.proposed_agent_actions (tenant_id, project_id, status);

comment on table public.proposed_agent_actions is
  'Human-in-control proposed actions. Slice 01 stores SUGGEST/PREPARE only; no autonomous writes.';

-- ---------------------------------------------------------------------------
-- RLS: internal tenant readers only. No portal/stakeholder access.
-- Cross-tenant traversal is impossible: every policy requires tenant membership.
-- Project isolation: tenant members/viewers need can_read_project_membership
-- (tenant owner/admin or active project member). Stakeholders stay excluded.
-- ---------------------------------------------------------------------------
alter table public.construction_entities enable row level security;
alter table public.construction_relations enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_run_steps enable row level security;
alter table public.proposed_agent_actions enable row level security;

drop policy if exists construction_entities_select on public.construction_entities;
drop policy if exists construction_entities_write on public.construction_entities;
drop policy if exists construction_relations_select on public.construction_relations;
drop policy if exists construction_relations_write on public.construction_relations;
drop policy if exists agent_runs_select on public.agent_runs;
drop policy if exists agent_runs_insert on public.agent_runs;
drop policy if exists agent_runs_update on public.agent_runs;
drop policy if exists agent_run_steps_select on public.agent_run_steps;
drop policy if exists agent_run_steps_insert on public.agent_run_steps;
drop policy if exists proposed_agent_actions_select on public.proposed_agent_actions;
drop policy if exists proposed_agent_actions_insert on public.proposed_agent_actions;
drop policy if exists proposed_agent_actions_update on public.proposed_agent_actions;

create policy construction_entities_select on public.construction_entities
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
  );
create policy construction_entities_write on public.construction_entities
  for all using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
  )
  with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
  );

create policy construction_relations_select on public.construction_relations
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
  );
create policy construction_relations_write on public.construction_relations
  for all using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
  )
  with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
  );

create policy agent_runs_select on public.agent_runs
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
  );
create policy agent_runs_insert on public.agent_runs
  for insert with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
  );
create policy agent_runs_update on public.agent_runs
  for update using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
  )
  with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
  );

create policy agent_run_steps_select on public.agent_run_steps
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
  );
create policy agent_run_steps_insert on public.agent_run_steps
  for insert with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
  );

create policy proposed_agent_actions_select on public.proposed_agent_actions
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
  );
create policy proposed_agent_actions_insert on public.proposed_agent_actions
  for insert with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
  );
create policy proposed_agent_actions_update on public.proposed_agent_actions
  for update using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
  )
  with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
  );

revoke all on table public.construction_entities from public, anon;
grant select, insert, update on public.construction_entities to authenticated;
grant all on public.construction_entities to service_role;

revoke all on table public.construction_relations from public, anon;
grant select, insert, update on public.construction_relations to authenticated;
grant all on public.construction_relations to service_role;

revoke all on table public.agent_runs from public, anon;
grant select, insert, update on public.agent_runs to authenticated;
grant all on public.agent_runs to service_role;

revoke all on table public.agent_run_steps from public, anon;
grant select, insert on public.agent_run_steps to authenticated;
grant all on public.agent_run_steps to service_role;

revoke all on table public.proposed_agent_actions from public, anon;
grant select, insert, update on public.proposed_agent_actions to authenticated;
grant all on public.proposed_agent_actions to service_role;
