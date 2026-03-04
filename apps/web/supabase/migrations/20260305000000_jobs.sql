-- Job queue: DB-backed, tenant-scoped, atomic claim, events, dead-letter.
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid,
  type text not null,
  payload jsonb not null default '{}',
  status text not null default 'queued' check (status in ('queued','running','success','failed','dead')),
  attempts int not null default 0,
  max_attempts int not null default 5,
  run_after timestamptz not null default now(),
  locked_by text,
  locked_at timestamptz,
  last_error text,
  last_error_type text,
  trace_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_jobs_claim on public.jobs(tenant_id, status, run_after) where status = 'queued';
create index if not exists idx_jobs_tenant_created on public.jobs(tenant_id, created_at desc);

create table if not exists public.job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  ts timestamptz not null default now(),
  event text not null,
  details jsonb default '{}'
);

create index if not exists idx_job_events_job on public.job_events(job_id);

alter table public.jobs enable row level security;
alter table public.job_events enable row level security;

create policy jobs_tenant on public.jobs for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
create policy job_events_via_job on public.job_events for all using (
  job_id in (select id from public.jobs where tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid()))
);

-- Atomic claim: lock up to p_limit queued jobs (optionally for one tenant), set running + locked_by/locked_at.
create or replace function public.claim_jobs(
  p_worker_id text,
  p_limit int default 5,
  p_tenant_id uuid default null
)
returns setof public.jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  return query
  with candidates as (
    select id from jobs
    where status = 'queued'
      and run_after <= now()
      and (p_tenant_id is null or tenant_id = p_tenant_id)
    order by created_at
    limit least(greatest(p_limit, 1), 20)
    for update skip locked
  )
  update jobs j
  set status = 'running',
      locked_by = p_worker_id,
      locked_at = now(),
      updated_at = now(),
      attempts = j.attempts + 1
  from candidates c
  where j.id = c.id
  returning j.*;
end;
$$;

-- Emit event helper (call after claim/complete/fail from app; or use from RPC if preferred).
-- Grant execute to service_role and authenticated.
revoke all on function public.claim_jobs(text, int, uuid) from public;
grant execute on function public.claim_jobs(text, int, uuid) to service_role;
grant execute on function public.claim_jobs(text, int, uuid) to authenticated;
