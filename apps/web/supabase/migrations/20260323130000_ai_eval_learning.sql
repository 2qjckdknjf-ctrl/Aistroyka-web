-- AI Brain Phase D: Eval & Learning layer.
-- Run records, feedback, eval cases, eval results, improvement candidates.

-- Run records
create table if not exists public.ai_run_records (
  id uuid primary key default gen_random_uuid(),
  run_id text not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  route text not null,
  mode text not null,
  truth_snapshot_ref text,
  action_plan_refs text[] default '{}',
  memory_refs text[] default '{}',
  output_contract_type text,
  degraded_flags text[] default '{}',
  execution_timing_ms int,
  validation_result text check (validation_result in ('ok', 'partial', 'fail')),
  version_refs jsonb default '[]',
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_run_records_run_id on public.ai_run_records(run_id);
create index if not exists idx_ai_run_records_tenant_created on public.ai_run_records(tenant_id, created_at desc);
create index if not exists idx_ai_run_records_project on public.ai_run_records(project_id, created_at desc) where project_id is not null;

alter table public.ai_run_records enable row level security;
create policy ai_run_records_tenant on public.ai_run_records for select using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
create policy ai_run_records_insert on public.ai_run_records for insert with check (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

-- Feedback records
create table if not exists public.ai_feedback_records (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.ai_run_records(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  source_kind text not null check (source_kind in ('human', 'system', 'test')),
  reviewer_role text,
  feedback_category text not null,
  factuality_score int check (factuality_score >= 0 and factuality_score <= 5),
  usefulness_score int check (usefulness_score >= 0 and usefulness_score <= 5),
  safety_score int check (safety_score >= 0 and safety_score <= 5),
  role_fit_score int check (role_fit_score >= 0 and role_fit_score <= 5),
  completeness_score int check (completeness_score >= 0 and completeness_score <= 5),
  comments text,
  linked_refs jsonb default '[]',
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_feedback_run on public.ai_feedback_records(run_id);
create index if not exists idx_ai_feedback_tenant on public.ai_feedback_records(tenant_id, created_at desc);

alter table public.ai_feedback_records enable row level security;
create policy ai_feedback_tenant on public.ai_feedback_records for select using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
create policy ai_feedback_insert on public.ai_feedback_records for insert with check (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

-- Eval cases (registry)
create table if not exists public.ai_eval_cases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  scenario_type text not null,
  mode text not null,
  required_inputs jsonb default '{}',
  expected_assertions jsonb default '[]',
  grading_strategy text default 'strict',
  tags text[] default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_eval_cases_active on public.ai_eval_cases(active) where active;

-- Eval results (no RLS for admin/eval use; service role)
create table if not exists public.ai_eval_results (
  id uuid primary key default gen_random_uuid(),
  eval_run_id text not null,
  case_id uuid references public.ai_eval_cases(id) on delete cascade,
  run_id uuid references public.ai_run_records(id) on delete set null,
  result text not null check (result in ('pass', 'fail', 'partial')),
  scores jsonb default '{}',
  grader_output text,
  warnings text[] default '{}',
  version_refs jsonb default '[]',
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_eval_results_run on public.ai_eval_results(eval_run_id);
create index if not exists idx_ai_eval_results_case on public.ai_eval_results(case_id);

-- Improvement candidates
create table if not exists public.ai_improvement_candidates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  source text not null check (source in ('feedback', 'eval', 'manual')),
  target_layer text not null check (target_layer in ('prompt', 'policy', 'planner', 'tooling', 'output', 'memory_retrieval')),
  rationale text not null,
  expected_gain text,
  risk text,
  readiness text default 'draft',
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  linked_evidence_refs jsonb default '[]',
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_improvement_tenant on public.ai_improvement_candidates(tenant_id);
create index if not exists idx_ai_improvement_review on public.ai_improvement_candidates(review_status);

alter table public.ai_improvement_candidates enable row level security;
create policy ai_improvement_tenant on public.ai_improvement_candidates for select using (
  tenant_id is null or tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
create policy ai_improvement_insert on public.ai_improvement_candidates for insert with check (true);
