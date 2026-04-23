-- Release 1: explicit trigger_analysis(job_id) RPC for re-queue flow.
-- Keeps existing job row, resets execution/error fields, and sets status='queued'.

create or replace function public.trigger_analysis(p_job_id uuid)
returns public.analysis_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.analysis_jobs;
begin
  update public.analysis_jobs j
  set
    status = 'queued',
    finished_at = null,
    error_message = null,
    error_type = null,
    execution_token = null,
    execution_started_at = null
  where j.id = p_job_id
  returning j.* into strict r;

  return r;
exception
  when no_data_found then
    raise exception 'analysis job not found: %', p_job_id using errcode = 'P0001';
end;
$$;

revoke all on function public.trigger_analysis(uuid) from public;
grant execute on function public.trigger_analysis(uuid) to service_role;
