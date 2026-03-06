-- AI provider health for circuit breaker (Phase 5.4).

create table if not exists public.ai_provider_health (
  provider text primary key,
  state text not null check (state in ('closed', 'open', 'half_open')),
  failure_count int not null default 0,
  last_failure_at timestamptz,
  updated_at timestamptz not null default now()
);
