-- Async vision job identity, client write lockdown, and terminal immutability.
-- attempt_count already exists (20261003145000). Do not add a second counter.

alter table public.analysis_jobs
  add column if not exists request_key text;

alter table public.analysis_jobs
  add column if not exists provider_metadata jsonb not null default '{}'::jsonb;

create unique index if not exists analysis_jobs_tenant_request_key
  on public.analysis_jobs (tenant_id, request_key)
  where request_key is not null;

-- Drop the previous FOR ALL tenant-member policy so viewers cannot INSERT completed jobs.
drop policy if exists analysis_jobs_tenant on public.analysis_jobs;
drop policy if exists analysis_jobs_select_internal on public.analysis_jobs;
create policy analysis_jobs_select_internal on public.analysis_jobs
  for select
  using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create or replace function public.enforce_analysis_job_service_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'analysis_jobs writes require service_role';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_analysis_jobs_service_writes on public.analysis_jobs;
create trigger trg_analysis_jobs_service_writes
  before insert or update on public.analysis_jobs
  for each row
  execute function public.enforce_analysis_job_service_writes();

revoke all on function public.enforce_analysis_job_service_writes() from public, anon, authenticated;

create or replace function public.enforce_analysis_job_terminal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status in ('completed', 'failed') then
      raise exception 'analysis_jobs cannot be inserted in a terminal status';
    end if;
    return new;
  end if;
  -- SUCCEEDED is immutable. FAILED_RETRYABLE must remain re-queueable via trigger_analysis (failed → queued).
  if old.status = 'completed' then
    if new.status is distinct from old.status
      or new.error_message is distinct from old.error_message
      or new.error_type is distinct from old.error_type
      or new.finished_at is distinct from old.finished_at
      or new.request_key is distinct from old.request_key
      or new.attempt_count is distinct from old.attempt_count
    then
      raise exception 'analysis_jobs completed rows are immutable';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_analysis_jobs_terminal_immutable on public.analysis_jobs;
create trigger trg_analysis_jobs_terminal_immutable
  before insert or update on public.analysis_jobs
  for each row
  execute function public.enforce_analysis_job_terminal();

revoke all on function public.enforce_analysis_job_terminal() from public, anon, authenticated;
