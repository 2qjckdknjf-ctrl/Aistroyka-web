-- Async vision job identity, retries, and terminal immutability.

alter table public.analysis_jobs
  add column if not exists request_key text;

alter table public.analysis_jobs
  add column if not exists attempts integer not null default 0;

alter table public.analysis_jobs
  add column if not exists provider_metadata jsonb not null default '{}'::jsonb;

create unique index if not exists analysis_jobs_tenant_request_key
  on public.analysis_jobs (tenant_id, request_key)
  where request_key is not null;

create or replace function public.enforce_analysis_job_terminal_immutable()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and old.status = 'completed' then
    if new.status is distinct from old.status
      or new.media_id is distinct from old.media_id
      or new.tenant_id is distinct from old.tenant_id
      or new.request_key is distinct from old.request_key
    then
      raise exception 'completed analysis jobs are immutable';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_analysis_jobs_terminal_immutable on public.analysis_jobs;
create trigger trg_analysis_jobs_terminal_immutable
  before update on public.analysis_jobs
  for each row
  execute function public.enforce_analysis_job_terminal_immutable();
