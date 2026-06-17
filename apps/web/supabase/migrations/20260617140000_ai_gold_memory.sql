-- Gold Memory MVP — append-only internal table, service-role only.
-- No pgvector in repo convention; embedding stored as jsonb float array.

create table if not exists public.ai_gold_memory (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  task_type text not null,
  audience text not null,
  provenance text not null check (provenance in (
    'expert_review',
    'manager_preference_pair',
    'human_authored'
  )),
  source_table text not null,
  source_id uuid not null,
  input_hash text not null,
  scrubbed_input_json jsonb not null default '{}',
  scrubbed_gold_output_json jsonb not null default '{}',
  rationale text null,
  embedding_json jsonb null,
  embedding_model text null,
  embedding_dim int null,
  pii_scrub_version text not null default 'v1',
  finance_guard_passed boolean not null default false,
  consent_snapshot boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_gold_memory_source_unique unique (source_table, source_id)
);

create index if not exists idx_ai_gold_memory_tenant_task_audience
  on public.ai_gold_memory(tenant_id, task_type, audience)
  where is_active = true;

create index if not exists idx_ai_gold_memory_input_hash
  on public.ai_gold_memory(input_hash);

create index if not exists idx_ai_gold_memory_tenant_created
  on public.ai_gold_memory(tenant_id, created_at desc);

alter table public.ai_gold_memory enable row level security;

drop policy if exists ai_gold_memory_deny_all on public.ai_gold_memory;
create policy ai_gold_memory_deny_all
  on public.ai_gold_memory
  for all
  using (false)
  with check (false);

comment on table public.ai_gold_memory is
  'Sanitized gold examples for retrieval/few-shot. Service-role only; RLS deny-all.';
