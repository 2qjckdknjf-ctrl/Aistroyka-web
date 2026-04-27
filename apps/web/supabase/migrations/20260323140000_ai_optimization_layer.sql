-- AI Brain Phase E: Controlled Optimization layer.
-- Proposals, packages, experiments, comparisons, decisions.

-- Optimization proposals (from improvement candidates)
create table if not exists public.ai_optimization_proposals (
  id uuid primary key default gen_random_uuid(),
  source_candidate_id uuid not null references public.ai_improvement_candidates(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  target_layer text not null check (target_layer in ('prompt', 'policy', 'planner', 'tooling', 'output', 'memory_retrieval', 'eval_config')),
  rationale text not null,
  linked_evidence_refs jsonb default '[]',
  expected_gain text,
  risk_level text not null default 'medium' check (risk_level in ('low', 'medium', 'high')),
  readiness text default 'draft',
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_opt_proposals_tenant on public.ai_optimization_proposals(tenant_id);
create index if not exists idx_ai_opt_proposals_candidate on public.ai_optimization_proposals(source_candidate_id);
create index if not exists idx_ai_opt_proposals_review on public.ai_optimization_proposals(review_status);

alter table public.ai_optimization_proposals enable row level security;
create policy ai_opt_proposals_tenant on public.ai_optimization_proposals for select using (
  tenant_id is null or tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
create policy ai_opt_proposals_insert on public.ai_optimization_proposals for insert with check (true);

-- Optimization packages (bundled changes)
create table if not exists public.ai_optimization_packages (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.ai_optimization_proposals(id) on delete cascade,
  package_type text not null,
  baseline_version_refs jsonb default '[]',
  candidate_version_refs jsonb default '[]',
  changed_components text[] default '{}',
  validation_requirements text[] default '{}',
  approval_required boolean not null default true,
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_opt_packages_proposal on public.ai_optimization_packages(proposal_id);

-- Optimization experiments (baseline vs candidate comparison)
create table if not exists public.ai_optimization_experiments (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.ai_optimization_packages(id) on delete cascade,
  baseline_refs jsonb default '[]',
  candidate_refs jsonb default '[]',
  execution_mode text not null check (execution_mode in ('sandbox', 'offline', 'replay', 'canary_simulation')),
  dataset_ref text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  result_summary text,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed'))
);

create index if not exists idx_ai_opt_experiments_package on public.ai_optimization_experiments(package_id);
create index if not exists idx_ai_opt_experiments_status on public.ai_optimization_experiments(status);

-- Optimization comparisons (experiment results)
create table if not exists public.ai_optimization_comparisons (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.ai_optimization_experiments(id) on delete cascade,
  baseline_score_summary jsonb default '{}',
  candidate_score_summary jsonb default '{}',
  delta_summary jsonb default '{}',
  risk_summary text,
  warnings text[] default '{}',
  regression_flags text[] default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_opt_comparisons_experiment on public.ai_optimization_comparisons(experiment_id);

-- Optimization decisions (review/approval)
create table if not exists public.ai_optimization_decisions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.ai_optimization_proposals(id) on delete cascade,
  package_id uuid references public.ai_optimization_packages(id) on delete set null,
  experiment_id uuid references public.ai_optimization_experiments(id) on delete set null,
  decision_type text not null check (decision_type in ('approve_for_canary', 'reject', 'revise', 'hold')),
  reviewer_id uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_opt_decisions_proposal on public.ai_optimization_decisions(proposal_id);
