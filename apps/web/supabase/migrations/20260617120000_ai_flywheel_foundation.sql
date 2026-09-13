-- AI Flywheel foundation (append-only, internal tables, consent column).
-- No production AI behavior change. Service-role-only for flywheel tables.

-- 1. Tenant training consent (default deny)
alter table public.tenants
  add column if not exists ai_training_consent boolean not null default false;

comment on column public.tenants.ai_training_consent is
  'Explicit opt-in for anonymized AI training flywheel use. Default false.';

-- 2. Preference pairs (internal / service-role only)
create table if not exists public.ai_preference_pairs (
  id uuid primary key default gen_random_uuid(),
  ai_request_id text,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  task_type text not null,
  audience text not null default 'internal',
  input_json jsonb not null default '{}',
  rejected_json jsonb not null default '{}',
  chosen_json jsonb not null default '{}',
  edit_distance int not null default 0,
  source text not null default 'system',
  low_value boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_preference_pairs_tenant_created
  on public.ai_preference_pairs(tenant_id, created_at desc);

create index if not exists idx_ai_preference_pairs_task_type
  on public.ai_preference_pairs(task_type, created_at desc);

alter table public.ai_preference_pairs enable row level security;

drop policy if exists ai_preference_pairs_deny_all on public.ai_preference_pairs;
create policy ai_preference_pairs_deny_all
  on public.ai_preference_pairs
  for all
  using (false)
  with check (false);

-- 3. Expert reviews (internal / service-role only)
create table if not exists public.ai_expert_reviews (
  id uuid primary key default gen_random_uuid(),
  ai_request_id text,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  task_type text not null,
  expert_user_id uuid not null references auth.users(id) on delete cascade,
  verdict text not null check (verdict in (
    'model_correct',
    'model_partially_correct',
    'model_wrong',
    'both_models_wrong'
  )),
  expert_conclusion text not null,
  expert_rationale text,
  corrected_output_json jsonb,
  input_source text not null default 'text',
  review_time_seconds int,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_expert_reviews_tenant_created
  on public.ai_expert_reviews(tenant_id, created_at desc);

create index if not exists idx_ai_expert_reviews_verdict
  on public.ai_expert_reviews(verdict, created_at desc);

alter table public.ai_expert_reviews enable row level security;

drop policy if exists ai_expert_reviews_deny_all on public.ai_expert_reviews;
create policy ai_expert_reviews_deny_all
  on public.ai_expert_reviews
  for all
  using (false)
  with check (false);
