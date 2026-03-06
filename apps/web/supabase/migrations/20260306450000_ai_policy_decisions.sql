-- AI governance: persist policy decisions (Phase 4.4).

create table if not exists public.ai_policy_decisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  trace_id text,
  decision text not null check (decision in ('allow', 'block', 'degrade')),
  rule_hits text[] default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_policy_decisions_tenant_created on public.ai_policy_decisions(tenant_id, created_at desc);

alter table public.ai_policy_decisions enable row level security;

create policy ai_policy_decisions_tenant on public.ai_policy_decisions for select using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
create policy ai_policy_decisions_insert on public.ai_policy_decisions for insert with check (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
