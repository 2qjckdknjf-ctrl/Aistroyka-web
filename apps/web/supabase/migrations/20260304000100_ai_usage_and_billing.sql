create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid,
  trace_id text,
  provider text,
  model text,
  tokens_input int,
  tokens_output int,
  tokens_total int,
  cost_usd numeric(12,6),
  status text,
  error_type text,
  duration_ms int,
  created_at timestamptz not null default now()
);
create index if not exists idx_ai_usage_tenant_created on public.ai_usage(tenant_id, created_at desc);
create index if not exists idx_ai_usage_created on public.ai_usage(created_at desc);

create table if not exists public.tenant_billing_state (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  budget_usd numeric(12,2) not null default 0,
  spent_usd numeric(12,2) not null default 0
);
alter table public.ai_usage enable row level security;
alter table public.tenant_billing_state enable row level security;
