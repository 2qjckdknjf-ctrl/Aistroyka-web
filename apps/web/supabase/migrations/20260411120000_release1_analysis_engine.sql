-- Release 1: AI analysis pipeline objects for environments bootstrapped from repo migrations.
-- Safe on fresh DBs (IF NOT EXISTS). If production already defines these objects differently,
-- review and apply manually or adjust before merge.

-- ---------------------------------------------------------------------------
-- projects.created_by (user_id): optional creator link for RLS/auditing
-- ---------------------------------------------------------------------------
alter table public.projects
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists idx_projects_user_id on public.projects (user_id)
  where user_id is not null;

-- ---------------------------------------------------------------------------
-- media (referenced by analysis_jobs and web upload flows)
-- ---------------------------------------------------------------------------
create table if not exists public.media (
  id uuid primary key default gen_random_uuid (),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  type text not null default 'image',
  file_url text not null,
  uploaded_at timestamptz not null default now ()
);

create index if not exists idx_media_project on public.media (project_id);
create index if not exists idx_media_tenant on public.media (tenant_id);

alter table public.media enable row level security;

drop policy if exists "media_tenant" on public.media;

create policy "media_tenant" on public.media for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid ())
  or tenant_id in (select id from public.tenants where user_id = auth.uid ())
);

-- ---------------------------------------------------------------------------
-- analysis_jobs + ai_analysis
-- ---------------------------------------------------------------------------
create table if not exists public.analysis_jobs (
  id uuid primary key default gen_random_uuid (),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  media_id uuid not null references public.media (id) on delete cascade,
  status text not null default 'queued' check (
    status in ('pending', 'queued', 'processing', 'completed', 'failed')
  ),
  priority text not null default 'normal',
  error_message text,
  error_type text,
  started_at timestamptz not null default now (),
  finished_at timestamptz,
  execution_token uuid,
  execution_started_at timestamptz,
  worker_id uuid
);

create index if not exists idx_analysis_jobs_media on public.analysis_jobs (media_id);
create index if not exists idx_analysis_jobs_tenant on public.analysis_jobs (tenant_id);
create index if not exists idx_analysis_jobs_status on public.analysis_jobs (status);

alter table public.analysis_jobs enable row level security;

drop policy if exists "analysis_jobs_tenant" on public.analysis_jobs;

create policy "analysis_jobs_tenant" on public.analysis_jobs for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid ())
  or tenant_id in (select id from public.tenants where user_id = auth.uid ())
);

create unique index if not exists one_active_analysis_job_per_media on public.analysis_jobs (media_id)
  where
    status in ('pending', 'queued', 'processing');

create table if not exists public.ai_analysis (
  id uuid primary key default gen_random_uuid (),
  media_id uuid not null references public.media (id) on delete cascade,
  job_id uuid references public.analysis_jobs (id) on delete set null,
  stage text,
  completion_percent integer,
  risk_level text,
  detected_issues text[],
  recommendations text[],
  frame_count integer,
  created_at timestamptz not null default now ()
);

create unique index if not exists one_result_per_job on public.ai_analysis (job_id)
  where
    job_id is not null;

alter table public.ai_analysis enable row level security;

drop policy if exists "ai_analysis_tenant" on public.ai_analysis;

create policy "ai_analysis_tenant" on public.ai_analysis for all using (
  media_id in (
    select m.id
    from public.media m
    where
      m.tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid ())
      or m.tenant_id in (select id from public.tenants where user_id = auth.uid ())
  )
);

-- ---------------------------------------------------------------------------
-- RPC: create_analysis_job (idempotent when an active job already exists)
-- ---------------------------------------------------------------------------
create or replace function public.create_analysis_job (
  p_tenant_id uuid,
  p_media_id uuid,
  p_priority text default 'normal'
) returns public.analysis_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  new_job public.analysis_jobs;
  v_priority text;
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

  v_priority := coalesce (nullif (trim (p_priority), ''), 'normal');

  insert into public.analysis_jobs(tenant_id, media_id, status, priority)
  values (p_tenant_id, p_media_id, 'queued', v_priority)
  returning * into new_job;

  return new_job;
exception
  when unique_violation then
    select * into new_job
    from public.analysis_jobs
    where
      media_id = p_media_id
      and status in ('pending', 'queued', 'processing')
    order by started_at desc
    limit 1;

    if new_job.id is null then
      raise;
    end if;

    return new_job;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: dequeue_job (used by web processOneJob with service role)
-- ---------------------------------------------------------------------------
create or replace function public.dequeue_job (
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
  -- Region-aware routing is optional; p_region_id reserved for future use.
  update public.analysis_jobs j
  set
    status = 'processing',
    started_at = now (),
    worker_id = coalesce (p_worker_id, j.worker_id)
  from (
    select id
    from public.analysis_jobs
    where
      status = 'queued'
    order by started_at asc
    limit 1
    for update
      skip locked
  ) picked
  where
    j.id = picked.id
  returning j.* into strict r;

  return r;
exception
  when no_data_found then
    return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: claim_job_execution
-- ---------------------------------------------------------------------------
create or replace function public.claim_job_execution (
  p_job_id uuid,
  p_worker_id uuid
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  update public.analysis_jobs
  set
    execution_token = gen_random_uuid (),
    execution_started_at = now (),
    worker_id = p_worker_id
  where
    id = p_job_id
    and status = 'processing'
    and execution_token is null;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: complete_analysis_job (minimal; no billing/system_capacity side effects)
-- ---------------------------------------------------------------------------
create or replace function public.complete_analysis_job (
  p_job_id uuid,
  p_stage text,
  p_completion_percent integer,
  p_risk_level text,
  p_detected_issues text[],
  p_recommendations text[],
  p_frame_count integer default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.analysis_jobs
    where
      id = p_job_id
      and status = 'processing'
      and execution_token is not null
  ) then
    raise exception 'Job not in processing state or execution not claimed';
  end if;

  if not exists (select 1 from public.ai_analysis where job_id = p_job_id) then
    insert into public.ai_analysis (
      media_id,
      job_id,
      stage,
      completion_percent,
      risk_level,
      detected_issues,
      recommendations,
      frame_count
    )
    select
      j.media_id,
      j.id,
      p_stage,
      p_completion_percent,
      p_risk_level,
      p_detected_issues,
      p_recommendations,
      p_frame_count
    from public.analysis_jobs j
    where
      j.id = p_job_id;
  end if;

  update public.analysis_jobs
  set
    status = 'completed',
    finished_at = now ()
  where
    id = p_job_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: trigger_analysis — re-queue an existing job (server verifies access)
-- ---------------------------------------------------------------------------
create or replace function public.trigger_analysis (p_job_id uuid) returns public.analysis_jobs
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
  where
    j.id = p_job_id
  returning j.* into strict r;

  return r;
exception
  when no_data_found then
    raise exception 'analysis job not found: %', p_job_id using errcode = 'P0001';
end;
$$;

revoke all on function public.create_analysis_job (uuid, uuid, text) from public;

grant execute on function public.create_analysis_job (uuid, uuid, text) to authenticated;

grant execute on function public.create_analysis_job (uuid, uuid, text) to service_role;

revoke all on function public.dequeue_job (text, uuid) from public;

grant execute on function public.dequeue_job (text, uuid) to service_role;

revoke all on function public.claim_job_execution (uuid, uuid) from public;

grant execute on function public.claim_job_execution (uuid, uuid) to service_role;

revoke all on function public.complete_analysis_job (uuid, text, integer, text, text[], text[], integer) from public;

grant execute on function public.complete_analysis_job (uuid, text, integer, text, text[], text[], integer) to service_role;

revoke all on function public.trigger_analysis (uuid) from public;

grant execute on function public.trigger_analysis (uuid) to service_role;
