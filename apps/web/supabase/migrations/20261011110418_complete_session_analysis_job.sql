-- The live legacy queue has this column, but the original repository bootstrap did
-- not define it. Preserve retry timing and make a fresh database reproducible.
-- No priority_order dependency: session candidates retain legacy enqueue order.
alter table public.analysis_jobs add column if not exists next_retry_at timestamptz;

-- Explicit session-worker completion, without the ambiguous legacy overloads.
-- Preserve the seven-argument completion semantics: result + terminal state;
-- do not introduce the older nine-argument capacity/billing side effects.
create or replace function public.complete_session_analysis_job(
  p_job_id uuid,
  p_tenant_id uuid,
  p_execution_token uuid,
  p_stage text,
  p_completion_percent integer,
  p_risk_level text,
  p_detected_issues text[],
  p_recommendations text[],
  p_frame_count integer default null
) returns void
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_media_id uuid;
begin
  if auth.role() is distinct from 'service_role' or p_execution_token is null then
    raise exception 'Session job completion requires service role and an execution token'
      using errcode = '42501';
  end if;
  select j.media_id into v_media_id
  from public.analysis_jobs j
  where j.id = p_job_id and j.tenant_id = p_tenant_id
    and j.status = 'processing' and j.execution_token = p_execution_token
  for update;
  if not found then
    raise exception 'Job scope or execution claim is invalid' using errcode = '42501';
  end if;
  if not exists (select 1 from public.ai_analysis where job_id = p_job_id) then
    insert into public.ai_analysis(media_id, job_id, stage, completion_percent,
      risk_level, detected_issues, recommendations, frame_count)
    values(v_media_id, p_job_id, p_stage, p_completion_percent,
      p_risk_level, p_detected_issues, p_recommendations, p_frame_count);
  end if;
  update public.analysis_jobs set status = 'completed', finished_at = now()
  where id = p_job_id and tenant_id = p_tenant_id and execution_token = p_execution_token;
end;
$$;

revoke all on function public.complete_session_analysis_job(uuid, uuid, uuid, text, integer, text, text[], text[], integer)
  from public, anon, authenticated;
grant execute on function public.complete_session_analysis_job(uuid, uuid, uuid, text, integer, text, text[], text[], integer)
  to service_role;

-- A delayed provider failure must not overwrite a new worker's execution claim.
create or replace function public.fail_session_analysis_job(
  p_job_id uuid, p_tenant_id uuid, p_execution_token uuid,
  p_error_message text, p_error_type text
) returns integer
language plpgsql security invoker set search_path = pg_catalog
as $$
begin
  if auth.role() is distinct from 'service_role' or p_execution_token is null then
    raise exception 'Session job failure requires service role and an execution token'
      using errcode = '42501';
  end if;
  perform 1 from public.analysis_jobs j
  where j.id = p_job_id and j.tenant_id = p_tenant_id
    and j.status = 'processing' and j.execution_token = p_execution_token
  for update;
  if not found then
    raise exception 'Job scope or execution claim is invalid' using errcode = '42501';
  end if;
  return public.record_analysis_job_failure(p_job_id, p_error_message, p_error_type);
end;
$$;
revoke all on function public.fail_session_analysis_job(uuid, uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.fail_session_analysis_job(uuid, uuid, uuid, text, text)
  to service_role;
