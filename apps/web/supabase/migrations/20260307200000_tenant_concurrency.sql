-- Tenant job concurrency cap (Phase 4.3).

create table if not exists public.tenant_concurrency (
  tenant_id uuid not null references public.tenants(id) on delete cascade primary key,
  jobs_running int not null default 0 check (jobs_running >= 0),
  max_jobs_running int not null default 2 check (max_jobs_running > 0),
  updated_at timestamptz not null default now()
);

create or replace function public.try_acquire_job_slot(p_tenant_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  insert into tenant_concurrency (tenant_id, jobs_running, max_jobs_running, updated_at)
  values (p_tenant_id, 0, 2, now())
  on conflict (tenant_id) do nothing;
  update tenant_concurrency
  set jobs_running = jobs_running + 1, updated_at = now()
  where tenant_id = p_tenant_id and jobs_running < max_jobs_running;
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

create or replace function public.release_job_slot(p_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update tenant_concurrency
  set jobs_running = greatest(0, jobs_running - 1), updated_at = now()
  where tenant_id = p_tenant_id;
end;
$$;

revoke all on function public.try_acquire_job_slot(uuid) from public;
grant execute on function public.try_acquire_job_slot(uuid) to service_role;
grant execute on function public.try_acquire_job_slot(uuid) to authenticated;
revoke all on function public.release_job_slot(uuid) from public;
grant execute on function public.release_job_slot(uuid) to service_role;
grant execute on function public.release_job_slot(uuid) to authenticated;
