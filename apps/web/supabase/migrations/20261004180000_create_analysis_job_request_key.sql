-- Bind request_key inside create_analysis_job so vision idempotency is atomic.
-- 3-arg callers stay valid: p_request_key defaults to null.

create or replace function public.create_analysis_job (
  p_tenant_id uuid,
  p_media_id uuid,
  p_priority text default 'normal',
  p_request_key text default null
) returns public.analysis_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  new_job public.analysis_jobs;
  v_priority text;
  v_request_key text;
begin
  if not exists (
    select 1
    from public.media m
    where
      m.id = p_media_id
      and m.tenant_id = p_tenant_id
  ) then
    raise exception 'Media not found for tenant' using errcode = 'P0002';
  end if;

  v_priority := coalesce(nullif(trim(p_priority), ''), 'normal');
  v_request_key := nullif(trim(p_request_key), '');

  if v_request_key is not null then
    select * into new_job
    from public.analysis_jobs
    where tenant_id = p_tenant_id
      and request_key = v_request_key
    limit 1;
    if new_job.id is not null then
      if new_job.media_id is distinct from p_media_id then
        raise exception 'Idempotency key already used' using errcode = '23505';
      end if;
      return new_job;
    end if;
  end if;

  select * into new_job
  from public.analysis_jobs
  where media_id = p_media_id
    and status in ('pending', 'queued', 'processing')
  order by started_at desc
  limit 1;

  if new_job.id is not null then
    if v_request_key is not null then
      if new_job.request_key is null then
        update public.analysis_jobs
        set
          request_key = v_request_key,
          provider_metadata = coalesce(provider_metadata, '{}'::jsonb) || jsonb_build_object('source', 'vision_async')
        where id = new_job.id
          and tenant_id = p_tenant_id
          and request_key is null
        returning * into new_job;
      elsif new_job.request_key is distinct from v_request_key then
        raise exception 'Idempotency key already used' using errcode = '23505';
      end if;
    end if;
    return new_job;
  end if;

  insert into public.analysis_jobs (
    tenant_id,
    media_id,
    status,
    priority,
    request_key,
    provider_metadata
  )
  values (
    p_tenant_id,
    p_media_id,
    'queued',
    v_priority,
    v_request_key,
    case
      when v_request_key is not null then jsonb_build_object('source', 'vision_async')
      else '{}'::jsonb
    end
  )
  returning * into new_job;

  return new_job;
exception
  when unique_violation then
    if v_request_key is not null then
      select * into new_job
      from public.analysis_jobs
      where tenant_id = p_tenant_id
        and request_key = v_request_key
      limit 1;
      if new_job.id is not null then
        if new_job.media_id is distinct from p_media_id then
          raise exception 'Idempotency key already used' using errcode = '23505';
        end if;
        return new_job;
      end if;
    end if;
    select * into new_job
    from public.analysis_jobs
    where media_id = p_media_id
      and status in ('pending', 'queued', 'processing')
    order by started_at desc
    limit 1;
    if new_job.id is null then
      raise;
    end if;
    return new_job;
end;
$$;

-- Trailing default means 3-arg RPC calls still bind to this function.
drop function if exists public.create_analysis_job(uuid, uuid, text);

revoke all on function public.create_analysis_job(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.create_analysis_job(uuid, uuid, text, text) to service_role;
