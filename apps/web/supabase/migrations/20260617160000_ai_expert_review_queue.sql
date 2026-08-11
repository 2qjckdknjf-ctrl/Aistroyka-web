-- Expert Review Queue MVP — pending candidates, service-role only.

create table if not exists public.ai_expert_review_queue (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  source_table text not null,
  source_id uuid not null,
  task_type text not null,
  audience text not null default 'manager',
  input_json jsonb not null default '{}',
  model_output_json jsonb not null default '{}',
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  status text not null default 'pending' check (status in (
    'pending', 'in_review', 'completed', 'skipped', 'rejected'
  )),
  assigned_expert_user_id uuid references auth.users(id) on delete set null,
  provenance text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_expert_review_queue_source_unique unique (source_table, source_id)
);

create index if not exists idx_ai_expert_review_queue_tenant_status
  on public.ai_expert_review_queue(tenant_id, status, created_at desc);

create index if not exists idx_ai_expert_review_queue_pending
  on public.ai_expert_review_queue(status, created_at desc)
  where status in ('pending', 'in_review');

alter table public.ai_expert_review_queue enable row level security;

drop policy if exists ai_expert_review_queue_deny_all on public.ai_expert_review_queue;
create policy ai_expert_review_queue_deny_all
  on public.ai_expert_review_queue
  for all
  using (false)
  with check (false);

comment on table public.ai_expert_review_queue is
  'Pending expert review candidates. Service-role only; RLS deny-all.';
