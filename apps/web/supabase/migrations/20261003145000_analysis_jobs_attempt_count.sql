-- Persist analysis job attempt counts so FAILED_RETRYABLE vs FAILED_FINAL is real.

alter table public.analysis_jobs
  add column if not exists attempt_count integer not null default 0;

comment on column public.analysis_jobs.attempt_count is
  'Atomic failure attempts. Incremented only by record_analysis_job_failure. Not reset on re-queue.';

create or replace function public.record_analysis_job_failure(
  p_job_id uuid,
  p_error_message text,
  p_error_type text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.analysis_jobs
  set
    status = 'failed',
    error_message = p_error_message,
    error_type = p_error_type,
    finished_at = now(),
    attempt_count = attempt_count + 1
  where id = p_job_id
    and status in ('pending', 'queued', 'processing')
  returning attempt_count into n;

  if n is null then
    select attempt_count into n from public.analysis_jobs where id = p_job_id;
  end if;
  return coalesce(n, 0);
end;
$$;

comment on function public.record_analysis_job_failure(uuid, text, text) is
  'Fail a live analysis job and increment attempt_count once. Concurrent callers cannot double-count a terminal row.';

revoke all on function public.record_analysis_job_failure(uuid, text, text) from public;
grant execute on function public.record_analysis_job_failure(uuid, text, text) to service_role;
