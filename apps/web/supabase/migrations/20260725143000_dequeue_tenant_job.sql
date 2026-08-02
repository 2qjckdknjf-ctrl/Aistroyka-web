-- Phase 2B.1: tenant-scoped analysis job dequeue for user HTTP processing.
-- Keeps global public.dequeue_job(text, uuid) for trusted background workers.
-- Fail-closed for user path: HTTP processor must call dequeue_tenant_job only.

create or replace function public.dequeue_tenant_job (
  p_tenant_id uuid,
  p_region_id text default null,
  p_worker_id uuid default null
) returns public.analysis_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.analysis_jobs;
begin
  if p_tenant_id is null then
    raise exception 'p_tenant_id is required';
  end if;

  -- p_region_id reserved for future region routing (same as global dequeue_job).
  update public.analysis_jobs j
  set
    status = 'processing',
    started_at = now (),
    worker_id = coalesce (p_worker_id, j.worker_id)
  from (
    select id
    from public.analysis_jobs
    where
      tenant_id = p_tenant_id
      and status = 'queued'
    order by started_at asc
    limit 1
    for update
      skip locked
  ) picked
  where
    j.id = picked.id
    and j.tenant_id = p_tenant_id
  returning j.* into strict r;

  return r;
exception
  when no_data_found then
    return null;
end;
$$;

comment on function public.dequeue_tenant_job (uuid, text, uuid) is
  'Tenant-scoped queued analysis job dequeue (FOR UPDATE SKIP LOCKED). Service role only. Used by user HTTP analysis process path.';

revoke all on function public.dequeue_tenant_job (uuid, text, uuid) from public;
revoke all on function public.dequeue_tenant_job (uuid, text, uuid) from anon;
revoke all on function public.dequeue_tenant_job (uuid, text, uuid) from authenticated;
grant execute on function public.dequeue_tenant_job (uuid, text, uuid) to service_role;

-- Speeds tenant-scoped SKIP LOCKED picks; safe if already present.
create index if not exists idx_analysis_jobs_tenant_queued_started
  on public.analysis_jobs (tenant_id, started_at)
  where status = 'queued';
