-- === 20250222000000_initial_schema.sql ===
-- Aistroyka AI Core MVP: projects and analyses

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  image_path text not null,
  stage text not null,
  completion_percent integer not null check (completion_percent >= 0 and completion_percent <= 100),
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  detected_issues text[] not null default '{}',
  recommendations text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_analyses_project_id on public.analyses(project_id);
create index if not exists idx_analyses_created_at on public.analyses(created_at desc);

-- RLS: enable and allow anon/authenticated read-write for MVP (restrict in later phases)
alter table public.projects enable row level security;
alter table public.analyses enable row level security;

create policy "Allow all for projects" on public.projects for all using (true) with check (true);
create policy "Allow all for analyses" on public.analyses for all using (true) with check (true);

-- Storage bucket for construction site images (create in Supabase Dashboard or via API)
-- Bucket name: site-images (private or public per your needs)

-- === 20250222100000_media_and_ai_analysis.sql ===
-- Media-based construction intelligence: media + ai_analysis

-- Drop legacy analyses (replaced by media -> ai_analysis)
drop table if exists public.analyses;

create table public.media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  type text not null check (type in ('image', 'video')),
  file_url text not null,
  uploaded_at timestamptz not null default now()
);

create table public.ai_analysis (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.media(id) on delete cascade,
  stage text,
  completion_percent integer not null check (completion_percent >= 0 and completion_percent <= 100),
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  detected_issues text[] not null default '{}',
  recommendations text[] not null default '{}',
  frame_count integer,
  created_at timestamptz not null default now()
);

create index idx_media_project_id on public.media(project_id);
create index idx_media_uploaded_at on public.media(uploaded_at desc);
create index idx_ai_analysis_media_id on public.ai_analysis(media_id);
create index idx_ai_analysis_created_at on public.ai_analysis(created_at desc);

alter table public.media enable row level security;
alter table public.ai_analysis enable row level security;

create policy "Allow all for media" on public.media for all using (true) with check (true);
create policy "Allow all for ai_analysis" on public.ai_analysis for all using (true) with check (true);

-- Storage: create bucket "media" in Supabase Dashboard (Storage) for image/video uploads.

-- === 20250222200000_ai_analysis_status.sql ===
-- Analysis lifecycle: status and error_message

alter table public.ai_analysis
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  add column if not exists error_message text;

-- Backfill existing rows (they already have results)
update public.ai_analysis set status = 'completed' where stage is not null;

create index if not exists idx_ai_analysis_status on public.ai_analysis(status);

-- === 20250222300000_analysis_jobs.sql ===
-- Analysis Job model: separate job lifecycle from analysis result storage

create table public.analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.media(id) on delete cascade,
  status text not null check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index idx_analysis_jobs_media_id on public.analysis_jobs(media_id);
create index idx_analysis_jobs_status on public.analysis_jobs(status);
create index idx_analysis_jobs_started_at on public.analysis_jobs(started_at desc);

alter table public.analysis_jobs enable row level security;
create policy "Allow all for analysis_jobs" on public.analysis_jobs for all using (true) with check (true);

-- ai_analysis: result-only; link to job that produced it
alter table public.ai_analysis add column if not exists job_id uuid references public.analysis_jobs(id) on delete set null;

-- Remove lifecycle from ai_analysis (status/error_message live on jobs)
alter table public.ai_analysis drop column if exists status;
alter table public.ai_analysis drop column if exists error_message;

drop index if exists public.idx_ai_analysis_status;

-- === 20250222400000_complete_analysis_job_rpc.sql ===
-- Atomic job completion: insert result and mark job completed in one transaction.
-- Prevents inconsistency where ai_analysis row exists but job stays 'processing', or vice versa.
-- If the function fails (e.g. INSERT or UPDATE error), the whole transaction rolls back: no partial state.
--
-- Partial unique index one_active_job_per_media: at most one row per media_id with status in
-- ('pending','processing'). A second createJob(media_id) while one is active will fail with unique violation.

create or replace function public.complete_analysis_job(
  p_job_id uuid,
  p_stage text,
  p_completion_percent integer,
  p_risk_level text,
  p_detected_issues text[],
  p_recommendations text[],
  p_frame_count integer default null
)
returns void
language plpgsql
security definer
as $$
begin
  -- insert result (media_id and job_id from the job row)
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
  where j.id = p_job_id;

  -- mark job completed (same transaction)
  update public.analysis_jobs
  set status = 'completed',
      finished_at = now()
  where id = p_job_id;
end;
$$;

-- At most one pending or processing job per media (prevents double processMedia for same media)
create unique index if not exists one_active_job_per_media
  on public.analysis_jobs (media_id)
  where status in ('pending', 'processing');

-- === 20250222500000_self_healing_jobs.sql ===
-- Self-healing: mark stale pending/processing jobs as failed; guard RPC against completing non-processing jobs.

-- Stale job cleanup: set to failed with error_message 'Timeout' and finished_at = now()
create or replace function public.mark_stale_jobs_failed(p_timeout_minutes integer default 15)
returns integer
language plpgsql
security definer
as $$
declare
  affected integer;
begin
  update public.analysis_jobs
  set status = 'failed',
      error_message = 'Timeout',
      finished_at = now()
  where status in ('pending', 'processing')
    and started_at < now() - (p_timeout_minutes || ' minutes')::interval;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- View: jobs that are still active (pending or processing)
create or replace view public.active_analysis_jobs as
select *
from public.analysis_jobs
where status in ('pending', 'processing');

-- RPC: before inserting result, verify job is still in 'processing' state
create or replace function public.complete_analysis_job(
  p_job_id uuid,
  p_stage text,
  p_completion_percent integer,
  p_risk_level text,
  p_detected_issues text[],
  p_recommendations text[],
  p_frame_count integer default null
)
returns void
language plpgsql
security definer
as $$
begin
  if not exists (
    select 1 from public.analysis_jobs
    where id = p_job_id and status = 'processing'
  ) then
    raise exception 'Job not in processing state';
  end if;

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
  where j.id = p_job_id;

  update public.analysis_jobs
  set status = 'completed',
      finished_at = now()
  where id = p_job_id;
end;
$$;

-- === 20250222600000_engine_hardening.sql ===
-- Deterministic engine hardening: at most one ai_analysis per job; updateJob only touches active jobs.

-- One result row per job (prevents duplicate results from concurrent RPC or retries)
create unique index if not exists one_result_per_job
  on public.ai_analysis (job_id)
  where job_id is not null;

-- === 20250222700000_auto_stale_job_sweep.sql ===
-- Automatic stale job sweep: pg_cron, logging table, updated function, scheduled job.

-- 1. Enable pg_cron (Supabase: may require enabling in Dashboard → Database → Extensions first)
create extension if not exists pg_cron;

-- 2. Logging table for sweep runs
create table if not exists public.job_sweep_log (
  id uuid primary key default gen_random_uuid(),
  executed_at timestamptz not null default now(),
  affected_rows integer not null
);

-- 3. Replace mark_stale_jobs_failed: same behavior + insert into job_sweep_log, return affected count
create or replace function public.mark_stale_jobs_failed(p_timeout_minutes integer default 15)
returns integer
language plpgsql
security definer
as $$
declare
  affected integer;
begin
  update public.analysis_jobs
  set status = 'failed',
      error_message = 'Timeout',
      finished_at = now()
  where status in ('pending', 'processing')
    and started_at < now() - (p_timeout_minutes || ' minutes')::interval;

  get diagnostics affected = row_count;

  insert into public.job_sweep_log (affected_rows)
  values (affected);

  return affected;
end;
$$;

-- 4. Schedule: every 5 minutes, run sweep with 15-minute timeout
select cron.schedule(
  'mark_stale_jobs_failed',
  '*/5 * * * *',
  $$SELECT public.mark_stale_jobs_failed(15)$$
);

-- === 20250222800000_pick_next_analysis_job.sql ===
-- Background worker: claim one pending job and return it with media details.
-- FOR UPDATE SKIP LOCKED ensures concurrent workers each get a different job.

create or replace function public.pick_next_analysis_job()
returns table (
  id uuid,
  media_id uuid,
  type text,
  file_url text,
  project_id uuid
)
language plpgsql
security definer
as $$
begin
  return query
  with next_job as (
    select j.id
    from public.analysis_jobs j
    where j.status = 'pending'
    order by j.started_at
    limit 1
    for update skip locked
  ),
  updated as (
    update public.analysis_jobs j
    set status = 'processing'
    from next_job, public.media m
    where j.id = next_job.id
      and j.media_id = m.id
    returning j.id, j.media_id, m.type, m.file_url, m.project_id
  )
  select
    u.id,
    u.media_id,
    u.type,
    u.file_url,
    u.project_id
  from updated u;
end;
$$;

-- === 20250222900000_observability_layer.sql ===
-- Production observability: worker heartbeats, job metrics, job durations.

-- 1. Worker heartbeat table (worker_id set by worker at startup; heartbeat and count updated by worker)
create table if not exists public.worker_heartbeat (
  worker_id text primary key,
  last_seen timestamptz not null default now(),
  processed_jobs integer not null default 0
);

-- 2. Aggregate job metrics (one row)
create or replace view public.job_metrics as
select
  count(*)::integer as total_jobs,
  count(*) filter (where status = 'pending')::integer as pending,
  count(*) filter (where status = 'processing')::integer as processing,
  count(*) filter (where status = 'completed')::integer as completed,
  count(*) filter (where status = 'failed')::integer as failed,
  avg(extract(epoch from (finished_at - started_at))) filter (where status = 'completed') as avg_processing_seconds
from public.analysis_jobs;

-- 3. Per-job durations for finished jobs
create or replace view public.job_durations as
select
  id,
  status,
  extract(epoch from (finished_at - started_at)) as duration_seconds
from public.analysis_jobs
where finished_at is not null;

-- RLS: allow same access as analysis_jobs for heartbeat (workers use anon key)
alter table public.worker_heartbeat enable row level security;
create policy "Allow all for worker_heartbeat" on public.worker_heartbeat for all using (true) with check (true);

-- Atomic increment processed_jobs for a worker (avoids read-modify-write race)
create or replace function public.increment_worker_processed(p_worker_id text)
returns void
language plpgsql
security definer
as $$
begin
  update public.worker_heartbeat
  set last_seen = now(),
      processed_jobs = processed_jobs + 1
  where worker_id = p_worker_id;
end;
$$;

-- === 20250223000000_enterprise_observability.sql ===
-- Enterprise observability: error classification, queue latency, worker status, failure metrics.

-- 1. Error type on analysis_jobs (set by worker when marking failed)
alter table public.analysis_jobs add column if not exists error_type text;

-- 2. Per-job latency: in-flight uses now(), finished uses finished_at
create or replace view public.queue_latency as
select
  id,
  media_id,
  status,
  started_at,
  finished_at,
  extract(epoch from (coalesce(finished_at, now()) - started_at)) as latency_seconds
from public.analysis_jobs;

-- 3. Worker liveness from heartbeat (alive if last_seen within 2 minutes)
create or replace view public.worker_status as
select
  worker_id,
  last_seen,
  processed_jobs,
  case
    when last_seen > now() - interval '2 minutes' then 'alive'
    else 'stale'
  end as status
from public.worker_heartbeat;

-- 4. Failure counts by error_type (failed jobs only; null error_type as 'unclassified')
create or replace view public.failure_metrics as
select
  coalesce(error_type, 'unclassified') as error_type,
  count(*)::integer as failed_count
from public.analysis_jobs
where status = 'failed'
group by error_type;

-- === 20250223100000_sla_and_trend_monitoring.sql ===
-- SLA and trend monitoring: breach detection, SLA metrics by type, failure trend, throughput.

-- SLA limits: image 30s, video 120s (wall-clock from started_at to finished_at)
-- 1. Jobs that completed but exceeded their type's SLA
create or replace view public.sla_breaches as
select
  j.id,
  j.media_id,
  m.type as media_type,
  j.started_at,
  j.finished_at,
  extract(epoch from (j.finished_at - j.started_at)) as duration_seconds,
  case when m.type = 'image' then 30 when m.type = 'video' then 120 end as sla_seconds
from public.analysis_jobs j
join public.media m on m.id = j.media_id
where j.status = 'completed'
  and j.finished_at is not null
  and (
    (m.type = 'image' and extract(epoch from (j.finished_at - j.started_at)) > 30)
    or (m.type = 'video' and extract(epoch from (j.finished_at - j.started_at)) > 120)
  );

-- 2. Per media type: totals, avg/max duration, breach percent
create or replace view public.sla_metrics as
select
  m.type as media_type,
  count(*)::integer as total_completed,
  avg(extract(epoch from (j.finished_at - j.started_at))) as avg_duration_seconds,
  max(extract(epoch from (j.finished_at - j.started_at))) as max_duration_seconds,
  round(
    100.0 * count(*) filter (
      where (m.type = 'image' and extract(epoch from (j.finished_at - j.started_at)) > 30)
         or (m.type = 'video' and extract(epoch from (j.finished_at - j.started_at)) > 120)
    ) / nullif(count(*), 0),
    2
  ) as breach_percent
from public.analysis_jobs j
join public.media m on m.id = j.media_id
where j.status = 'completed'
  and j.finished_at is not null
group by m.type;

-- 3. Failure counts by hour and error_type
create or replace view public.failure_trend as
select
  date_trunc('hour', finished_at) as hour,
  coalesce(error_type, 'unclassified') as error_type,
  count(*)::integer as failure_count
from public.analysis_jobs
where status = 'failed'
  and finished_at is not null
group by date_trunc('hour', finished_at), error_type;

-- 4. Completed jobs per hour (throughput)
create or replace view public.job_throughput as
select
  date_trunc('hour', finished_at) as hour,
  count(*)::integer as completed_jobs
from public.analysis_jobs
where status = 'completed'
  and finished_at is not null
group by date_trunc('hour', finished_at);

-- === 20250223200000_priority_queue_and_sla_tiers.sql ===
-- Priority queue and tier-based SLA: priority column, selection order, SLA by (type, priority).

-- 1. Priority column (default 'normal' for existing and new rows)
alter table public.analysis_jobs
  add column if not exists priority text not null default 'normal'
  check (priority in ('high', 'normal', 'low'));

-- 2. Index for job selection: priority, status, started_at
create index if not exists idx_analysis_jobs_priority_status_started
  on public.analysis_jobs (priority, status, started_at);

-- 3. Job selection: pending only, order by priority (high first) then started_at, limit 1
create or replace function public.pick_next_analysis_job()
returns table (
  id uuid,
  media_id uuid,
  type text,
  file_url text,
  project_id uuid
)
language plpgsql
security definer
as $$
begin
  return query
  with priority_ord as (
    select j.id,
           case j.priority when 'high' then 1 when 'normal' then 2 when 'low' then 3 end as ord
    from public.analysis_jobs j
    where j.status = 'pending'
    order by case j.priority when 'high' then 1 when 'normal' then 2 when 'low' then 3 end,
             j.started_at
    limit 1
    for update skip locked
  ),
  next_job as (
    select id from priority_ord
  ),
  updated as (
    update public.analysis_jobs j
    set status = 'processing'
    from next_job, public.media m
    where j.id = next_job.id
      and j.media_id = m.id
    returning j.id, j.media_id, m.type, m.file_url, m.project_id
  )
  select
    u.id,
    u.media_id,
    u.type,
    u.file_url,
    u.project_id
  from updated u;
end;
$$;

-- 4. SLA limits by (media_type, priority): image high 20s, normal 30s, low 45s; video high 90s, normal 120s, low 180s
-- sla_breaches: completed jobs exceeding their tier's limit
create or replace view public.sla_breaches as
select
  j.id,
  j.media_id,
  m.type as media_type,
  j.priority,
  j.started_at,
  j.finished_at,
  extract(epoch from (j.finished_at - j.started_at)) as duration_seconds,
  case
    when m.type = 'image' and j.priority = 'high' then 20
    when m.type = 'image' and j.priority = 'normal' then 30
    when m.type = 'image' and j.priority = 'low' then 45
    when m.type = 'video' and j.priority = 'high' then 90
    when m.type = 'video' and j.priority = 'normal' then 120
    when m.type = 'video' and j.priority = 'low' then 180
  end as sla_seconds
from public.analysis_jobs j
join public.media m on m.id = j.media_id
where j.status = 'completed'
  and j.finished_at is not null
  and extract(epoch from (j.finished_at - j.started_at)) > (
    case
      when m.type = 'image' and j.priority = 'high' then 20
      when m.type = 'image' and j.priority = 'normal' then 30
      when m.type = 'image' and j.priority = 'low' then 45
      when m.type = 'video' and j.priority = 'high' then 90
      when m.type = 'video' and j.priority = 'normal' then 120
      when m.type = 'video' and j.priority = 'low' then 180
    end
  );

-- 5. sla_metrics: breach_percent uses tier-based SLA (same limits)
create or replace view public.sla_metrics as
select
  m.type as media_type,
  j.priority,
  count(*)::integer as total_completed,
  avg(extract(epoch from (j.finished_at - j.started_at))) as avg_duration_seconds,
  max(extract(epoch from (j.finished_at - j.started_at))) as max_duration_seconds,
  round(
    100.0 * count(*) filter (
      where (m.type = 'image' and j.priority = 'high' and extract(epoch from (j.finished_at - j.started_at)) > 20)
         or (m.type = 'image' and j.priority = 'normal' and extract(epoch from (j.finished_at - j.started_at)) > 30)
         or (m.type = 'image' and j.priority = 'low' and extract(epoch from (j.finished_at - j.started_at)) > 45)
         or (m.type = 'video' and j.priority = 'high' and extract(epoch from (j.finished_at - j.started_at)) > 90)
         or (m.type = 'video' and j.priority = 'normal' and extract(epoch from (j.finished_at - j.started_at)) > 120)
         or (m.type = 'video' and j.priority = 'low' and extract(epoch from (j.finished_at - j.started_at)) > 180)
    ) / nullif(count(*), 0),
    2
  ) as breach_percent
from public.analysis_jobs j
join public.media m on m.id = j.media_id
where j.status = 'completed'
  and j.finished_at is not null
group by m.type, j.priority;

-- === 20250223300000_multi_tenant_v1.sql ===
-- Multi-tenant isolation (v1): tenants table, tenant_id on projects/media/jobs/ai_analysis, SLA by plan.

-- 1. Tenants table
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text,
  plan text not null check (plan in ('free', 'pro', 'enterprise')),
  created_at timestamptz not null default now()
);

alter table public.tenants enable row level security;
create policy "Allow all for tenants" on public.tenants for all using (true) with check (true);

-- 2. Default tenant for backfill
insert into public.tenants (name, plan) values ('Default', 'pro');

-- 3. projects: add tenant_id, backfill, NOT NULL
alter table public.projects add column if not exists tenant_id uuid references public.tenants(id) on delete restrict;
update public.projects set tenant_id = (select id from public.tenants limit 1) where tenant_id is null;
alter table public.projects alter column tenant_id set not null;

-- 4. media: add tenant_id, backfill from project, NOT NULL
alter table public.media add column if not exists tenant_id uuid references public.tenants(id) on delete restrict;
update public.media set tenant_id = (select tenant_id from public.projects p where p.id = media.project_id) where tenant_id is null;
alter table public.media alter column tenant_id set not null;

-- 4b. Trigger: set media.tenant_id from project on insert
create or replace function public.set_media_tenant_id()
returns trigger language plpgsql as $$
begin
  if new.tenant_id is null then
    select tenant_id into new.tenant_id from public.projects where id = new.project_id;
  end if;
  return new;
end; $$;
drop trigger if exists set_media_tenant_id_trigger on public.media;
create trigger set_media_tenant_id_trigger
  before insert on public.media for each row execute function public.set_media_tenant_id();

-- 5. analysis_jobs: add tenant_id, backfill from media, NOT NULL
alter table public.analysis_jobs add column if not exists tenant_id uuid references public.tenants(id) on delete restrict;
update public.analysis_jobs set tenant_id = (select tenant_id from public.media m where m.id = analysis_jobs.media_id) where tenant_id is null;
alter table public.analysis_jobs alter column tenant_id set not null;

-- 6. ai_analysis: add tenant_id, backfill from media, NOT NULL
alter table public.ai_analysis add column if not exists tenant_id uuid references public.tenants(id) on delete restrict;
update public.ai_analysis set tenant_id = (select tenant_id from public.media m where m.id = ai_analysis.media_id) where tenant_id is null;
alter table public.ai_analysis alter column tenant_id set not null;

-- 6b. Trigger: set ai_analysis.tenant_id on insert (from job or media for RPC/legacy inserts)
create or replace function public.set_ai_analysis_tenant_id()
returns trigger language plpgsql as $$
begin
  if new.tenant_id is null then
    if new.job_id is not null then
      select tenant_id into new.tenant_id from public.analysis_jobs where id = new.job_id;
    end if;
    if new.tenant_id is null and new.media_id is not null then
      select tenant_id into new.tenant_id from public.media where id = new.media_id;
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists set_ai_analysis_tenant_id_trigger on public.ai_analysis;
create trigger set_ai_analysis_tenant_id_trigger
  before insert on public.ai_analysis for each row execute function public.set_ai_analysis_tenant_id();

-- 7. Trigger: set analysis_jobs.tenant_id from media on insert (keeps createJob(mediaId) working)
create or replace function public.set_analysis_job_tenant_id()
returns trigger
language plpgsql
as $$
begin
  if new.tenant_id is null then
    select tenant_id into new.tenant_id from public.media where id = new.media_id;
  end if;
  return new;
end;
$$;
drop trigger if exists set_analysis_job_tenant_id_trigger on public.analysis_jobs;
create trigger set_analysis_job_tenant_id_trigger
  before insert on public.analysis_jobs
  for each row execute function public.set_analysis_job_tenant_id();

-- 8. Job selection: optional tenant filter (when set, only that tenant's pending jobs are considered)
create or replace function public.pick_next_analysis_job(p_tenant_id uuid default null)
returns table (
  id uuid,
  media_id uuid,
  type text,
  file_url text,
  project_id uuid
)
language plpgsql
security definer
as $$
begin
  return query
  with priority_ord as (
    select j.id
    from public.analysis_jobs j
    where j.status = 'pending'
      and (p_tenant_id is null or j.tenant_id = p_tenant_id)
    order by case j.priority when 'high' then 1 when 'normal' then 2 when 'low' then 3 end,
             j.started_at
    limit 1
    for update skip locked
  ),
  next_job as (
    select priority_ord.id from priority_ord
  ),
  updated as (
    update public.analysis_jobs j
    set status = 'processing'
    from next_job, public.media m
    where j.id = next_job.id
      and j.media_id = m.id
    returning j.id, j.media_id, m.type, m.file_url, m.project_id
  )
  select
    u.id,
    u.media_id,
    u.type,
    u.file_url,
    u.project_id
  from updated u;
end;
$$;

-- 9. SLA matrix: (plan, media_type, priority) -> seconds
-- free:       image 30/45/60,   video 120/180/240
-- pro:       image 20/30/45,   video 90/120/180
-- enterprise: image 15/25/40,  video 60/90/150
create or replace view public.sla_breaches as
select
  j.id,
  j.tenant_id,
  t.plan as tenant_plan,
  j.media_id,
  m.type as media_type,
  j.priority,
  j.started_at,
  j.finished_at,
  extract(epoch from (j.finished_at - j.started_at)) as duration_seconds,
  case
    when t.plan = 'free'      and m.type = 'image' and j.priority = 'high' then 30
    when t.plan = 'free'      and m.type = 'image' and j.priority = 'normal' then 45
    when t.plan = 'free'      and m.type = 'image' and j.priority = 'low' then 60
    when t.plan = 'free'      and m.type = 'video' and j.priority = 'high' then 120
    when t.plan = 'free'      and m.type = 'video' and j.priority = 'normal' then 180
    when t.plan = 'free'      and m.type = 'video' and j.priority = 'low' then 240
    when t.plan = 'pro'       and m.type = 'image' and j.priority = 'high' then 20
    when t.plan = 'pro'       and m.type = 'image' and j.priority = 'normal' then 30
    when t.plan = 'pro'       and m.type = 'image' and j.priority = 'low' then 45
    when t.plan = 'pro'       and m.type = 'video' and j.priority = 'high' then 90
    when t.plan = 'pro'       and m.type = 'video' and j.priority = 'normal' then 120
    when t.plan = 'pro'       and m.type = 'video' and j.priority = 'low' then 180
    when t.plan = 'enterprise' and m.type = 'image' and j.priority = 'high' then 15
    when t.plan = 'enterprise' and m.type = 'image' and j.priority = 'normal' then 25
    when t.plan = 'enterprise' and m.type = 'image' and j.priority = 'low' then 40
    when t.plan = 'enterprise' and m.type = 'video' and j.priority = 'high' then 60
    when t.plan = 'enterprise' and m.type = 'video' and j.priority = 'normal' then 90
    when t.plan = 'enterprise' and m.type = 'video' and j.priority = 'low' then 150
  end as sla_seconds
from public.analysis_jobs j
join public.media m on m.id = j.media_id
join public.tenants t on t.id = j.tenant_id
where j.status = 'completed'
  and j.finished_at is not null
  and extract(epoch from (j.finished_at - j.started_at)) > (
    case
      when t.plan = 'free'      and m.type = 'image' and j.priority = 'high' then 30
      when t.plan = 'free'      and m.type = 'image' and j.priority = 'normal' then 45
      when t.plan = 'free'      and m.type = 'image' and j.priority = 'low' then 60
      when t.plan = 'free'      and m.type = 'video' and j.priority = 'high' then 120
      when t.plan = 'free'      and m.type = 'video' and j.priority = 'normal' then 180
      when t.plan = 'free'      and m.type = 'video' and j.priority = 'low' then 240
      when t.plan = 'pro'       and m.type = 'image' and j.priority = 'high' then 20
      when t.plan = 'pro'       and m.type = 'image' and j.priority = 'normal' then 30
      when t.plan = 'pro'       and m.type = 'image' and j.priority = 'low' then 45
      when t.plan = 'pro'       and m.type = 'video' and j.priority = 'high' then 90
      when t.plan = 'pro'       and m.type = 'video' and j.priority = 'normal' then 120
      when t.plan = 'pro'       and m.type = 'video' and j.priority = 'low' then 180
      when t.plan = 'enterprise' and m.type = 'image' and j.priority = 'high' then 15
      when t.plan = 'enterprise' and m.type = 'image' and j.priority = 'normal' then 25
      when t.plan = 'enterprise' and m.type = 'image' and j.priority = 'low' then 40
      when t.plan = 'enterprise' and m.type = 'video' and j.priority = 'high' then 60
      when t.plan = 'enterprise' and m.type = 'video' and j.priority = 'normal' then 90
      when t.plan = 'enterprise' and m.type = 'video' and j.priority = 'low' then 150
    end
  );

-- 10. sla_metrics: group by tenant plan, media type, priority; breach_percent from same matrix
create or replace view public.sla_metrics as
select
  t.plan as tenant_plan,
  m.type as media_type,
  j.priority,
  count(*)::integer as total_completed,
  avg(extract(epoch from (j.finished_at - j.started_at))) as avg_duration_seconds,
  max(extract(epoch from (j.finished_at - j.started_at))) as max_duration_seconds,
  round(
    100.0 * count(*) filter (
      where (t.plan = 'free' and m.type = 'image' and j.priority = 'high' and extract(epoch from (j.finished_at - j.started_at)) > 30)
         or (t.plan = 'free' and m.type = 'image' and j.priority = 'normal' and extract(epoch from (j.finished_at - j.started_at)) > 45)
         or (t.plan = 'free' and m.type = 'image' and j.priority = 'low' and extract(epoch from (j.finished_at - j.started_at)) > 60)
         or (t.plan = 'free' and m.type = 'video' and j.priority = 'high' and extract(epoch from (j.finished_at - j.started_at)) > 120)
         or (t.plan = 'free' and m.type = 'video' and j.priority = 'normal' and extract(epoch from (j.finished_at - j.started_at)) > 180)
         or (t.plan = 'free' and m.type = 'video' and j.priority = 'low' and extract(epoch from (j.finished_at - j.started_at)) > 240)
         or (t.plan = 'pro' and m.type = 'image' and j.priority = 'high' and extract(epoch from (j.finished_at - j.started_at)) > 20)
         or (t.plan = 'pro' and m.type = 'image' and j.priority = 'normal' and extract(epoch from (j.finished_at - j.started_at)) > 30)
         or (t.plan = 'pro' and m.type = 'image' and j.priority = 'low' and extract(epoch from (j.finished_at - j.started_at)) > 45)
         or (t.plan = 'pro' and m.type = 'video' and j.priority = 'high' and extract(epoch from (j.finished_at - j.started_at)) > 90)
         or (t.plan = 'pro' and m.type = 'video' and j.priority = 'normal' and extract(epoch from (j.finished_at - j.started_at)) > 120)
         or (t.plan = 'pro' and m.type = 'video' and j.priority = 'low' and extract(epoch from (j.finished_at - j.started_at)) > 180)
         or (t.plan = 'enterprise' and m.type = 'image' and j.priority = 'high' and extract(epoch from (j.finished_at - j.started_at)) > 15)
         or (t.plan = 'enterprise' and m.type = 'image' and j.priority = 'normal' and extract(epoch from (j.finished_at - j.started_at)) > 25)
         or (t.plan = 'enterprise' and m.type = 'image' and j.priority = 'low' and extract(epoch from (j.finished_at - j.started_at)) > 40)
         or (t.plan = 'enterprise' and m.type = 'video' and j.priority = 'high' and extract(epoch from (j.finished_at - j.started_at)) > 60)
         or (t.plan = 'enterprise' and m.type = 'video' and j.priority = 'normal' and extract(epoch from (j.finished_at - j.started_at)) > 90)
         or (t.plan = 'enterprise' and m.type = 'video' and j.priority = 'low' and extract(epoch from (j.finished_at - j.started_at)) > 150)
    ) / nullif(count(*), 0),
    2
  ) as breach_percent
from public.analysis_jobs j
join public.media m on m.id = j.media_id
join public.tenants t on t.id = j.tenant_id
where j.status = 'completed'
  and j.finished_at is not null
group by t.plan, m.type, j.priority;

-- === 20250223400000_tenant_quota_check.sql ===
-- Tenant Quota Engine v1: per-tenant concurrent and hourly limits.
-- Replaces plan-based quota with tenant-level columns and views.

-- 1. Add quota columns to tenants
alter table public.tenants
  add column if not exists max_concurrent_jobs integer not null default 5,
  add column if not exists max_jobs_per_hour integer not null default 100;

-- 2. View: active (pending + processing) job count per tenant
create or replace view public.tenant_active_jobs as
select
  tenant_id,
  count(*)::integer as active_count
from public.analysis_jobs
where status in ('pending', 'processing')
group by tenant_id;

-- 3. View: jobs started per tenant per hour (current hour = date_trunc('hour', started_at))
create or replace view public.tenant_hourly_usage as
select
  tenant_id,
  date_trunc('hour', started_at) as hour,
  count(*)::integer as jobs_started
from public.analysis_jobs
group by tenant_id, date_trunc('hour', started_at);

-- 4. Check tenant quota: concurrent and hourly. Raises if exceeded.
create or replace function public.check_tenant_quota(p_tenant_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_max_concurrent integer;
  v_max_per_hour integer;
  v_active integer;
  v_this_hour integer;
begin
  select t.max_concurrent_jobs, t.max_jobs_per_hour
  into v_max_concurrent, v_max_per_hour
  from public.tenants t
  where t.id = p_tenant_id;

  if v_max_concurrent is null then
    raise exception 'Tenant not found' using errcode = 'P0002';
  end if;

  select coalesce(a.active_count, 0) into v_active
  from public.tenant_active_jobs a
  where a.tenant_id = p_tenant_id;

  select coalesce(h.jobs_started, 0) into v_this_hour
  from public.tenant_hourly_usage h
  where h.tenant_id = p_tenant_id
    and h.hour = date_trunc('hour', now());

  if v_active >= v_max_concurrent then
    raise exception 'Tenant concurrent job quota exceeded: % active, limit %', coalesce(v_active, 0), v_max_concurrent
      using errcode = 'P0001';
  end if;

  if v_this_hour >= v_max_per_hour then
    raise exception 'Tenant hourly job quota exceeded: % started this hour, limit %', coalesce(v_this_hour, 0), v_max_per_hour
      using errcode = 'P0001';
  end if;
end;
$$;

-- === 20250223500000_atomic_job_creation_rpc.sql ===
-- Atomic job creation: tenant row lock + quota check + insert in one transaction (eliminates race).

create or replace function public.create_analysis_job(
  p_tenant_id uuid,
  p_media_id uuid,
  p_priority text default 'normal'
)
returns public.analysis_jobs
language plpgsql
security definer
as $$
declare
  concurrent_count integer;
  hourly_count integer;
  max_concurrent integer;
  max_hourly integer;
  new_job public.analysis_jobs;
begin

  -- 1. Lock tenant row (prevents concurrent quota race)
  select max_concurrent_jobs, max_jobs_per_hour
  into max_concurrent, max_hourly
  from public.tenants
  where id = p_tenant_id
  for update;

  if max_concurrent is null then
    raise exception 'Tenant not found';
  end if;

  -- 2. Check concurrent jobs
  select count(*)
  into concurrent_count
  from public.analysis_jobs
  where tenant_id = p_tenant_id
    and status in ('pending','processing');

  if concurrent_count >= max_concurrent then
    raise exception 'Concurrent job limit exceeded';
  end if;

  -- 3. Check hourly usage
  select count(*)
  into hourly_count
  from public.analysis_jobs
  where tenant_id = p_tenant_id
    and started_at >= date_trunc('hour', now());

  if hourly_count >= max_hourly then
    raise exception 'Hourly job limit exceeded';
  end if;

  -- 4. Insert job
  insert into public.analysis_jobs (
    tenant_id,
    media_id,
    status,
    priority
  )
  values (
    p_tenant_id,
    p_media_id,
    'pending',
    p_priority
  )
  returning *
  into new_job;

  return new_job;
end;
$$;

-- === 20250223600000_usage_accounting_v1.sql ===
-- Usage accounting foundation v1: per-tenant usage events and summary views.

-- 1. Usage events table
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  job_id uuid references public.analysis_jobs(id) on delete set null,
  event_type text not null check (event_type in ('job_completed', 'ai_cost', 'video_minutes')),
  quantity numeric not null,
  created_at timestamptz not null default now()
);

create index idx_usage_events_tenant_id on public.usage_events(tenant_id);
create index idx_usage_events_created_at on public.usage_events(created_at desc);
create index idx_usage_events_event_type on public.usage_events(event_type);

alter table public.usage_events enable row level security;
create policy "Allow all for usage_events" on public.usage_events for all using (true) with check (true);

-- 2. complete_analysis_job: after successful completion, insert usage_events (job_completed, ai_cost, video_minutes if video)
create or replace function public.complete_analysis_job(
  p_job_id uuid,
  p_stage text,
  p_completion_percent integer,
  p_risk_level text,
  p_detected_issues text[],
  p_recommendations text[],
  p_frame_count integer default null,
  p_ai_cost numeric default 0.01,
  p_video_minutes numeric default 0
)
returns void
language plpgsql
security definer
as $$
declare
  v_tenant_id uuid;
  v_media_type text;
begin
  if not exists (
    select 1 from public.analysis_jobs
    where id = p_job_id and status = 'processing'
  ) then
    raise exception 'Job not in processing state';
  end if;

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
  where j.id = p_job_id;

  update public.analysis_jobs
  set status = 'completed',
      finished_at = now()
  where id = p_job_id;

  -- Usage: get tenant and media type for this job
  select j.tenant_id, m.type into v_tenant_id, v_media_type
  from public.analysis_jobs j
  join public.media m on m.id = j.media_id
  where j.id = p_job_id;

  insert into public.usage_events (tenant_id, job_id, event_type, quantity)
  values
    (v_tenant_id, p_job_id, 'job_completed', 1),
    (v_tenant_id, p_job_id, 'ai_cost', p_ai_cost);

  if v_media_type = 'video' and p_video_minutes > 0 then
    insert into public.usage_events (tenant_id, job_id, event_type, quantity)
    values (v_tenant_id, p_job_id, 'video_minutes', p_video_minutes);
  end if;
end;
$$;

-- 3. Tenant usage summary: total quantity per tenant per event_type (all time)
create or replace view public.tenant_usage_summary as
select
  tenant_id,
  event_type,
  sum(quantity) as total_quantity,
  count(*)::integer as event_count
from public.usage_events
group by tenant_id, event_type;

-- 4. Tenant monthly usage: total quantity per tenant per month per event_type
create or replace view public.tenant_monthly_usage as
select
  tenant_id,
  date_trunc('month', created_at) as month,
  event_type,
  sum(quantity) as total_quantity,
  count(*)::integer as event_count
from public.usage_events
group by tenant_id, date_trunc('month', created_at), event_type;

-- === 20250223700000_billing_engine_v1.sql ===
-- Billing engine foundation v1: plan pricing, referential integrity, deterministic one-invoice-per-tenant-per-month.

-- 1. Plan pricing (id referenced by tenants.plan)
create table if not exists public.plans (
  id text primary key,
  price_per_job numeric not null default 0,
  price_per_ai_cost numeric not null default 0,
  price_per_video_minute numeric not null default 0
);

insert into public.plans (id, price_per_job, price_per_ai_cost, price_per_video_minute)
values
  ('free', 0, 0, 0),
  ('pro', 0.05, 0.02, 0.10),
  ('enterprise', 0.03, 0.01, 0.05)
on conflict (id) do nothing;

alter table public.plans enable row level security;
create policy "Allow all for plans" on public.plans for all using (true) with check (true);

-- 2. FK from tenants.plan to plans.id (referential integrity)
alter table public.tenants
  drop constraint if exists tenants_plan_check;
alter table public.tenants
  add constraint fk_tenants_plan foreign key (plan) references public.plans(id);

-- 3. Billing snapshots: exactly one row per (tenant_id, month_bucket); no NULL monetary fields
create table if not exists public.billing_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  month_bucket timestamptz not null,
  total_jobs numeric not null,
  total_ai_cost numeric not null,
  total_video_minutes numeric not null,
  total_amount numeric not null,
  created_at timestamptz not null default now()
);

create unique index uniq_billing_snapshots_tenant_month
  on public.billing_snapshots (tenant_id, month_bucket);

create index idx_billing_snapshots_tenant_id on public.billing_snapshots(tenant_id);
create index idx_billing_snapshots_month_bucket on public.billing_snapshots(month_bucket);

alter table public.billing_snapshots enable row level security;
create policy "Allow all for billing_snapshots" on public.billing_snapshots for all using (true) with check (true);

-- 4. Generate monthly invoice: one snapshot per tenant per month; raise if duplicate or tenant missing
create or replace function public.generate_monthly_invoice(
  p_tenant_id uuid,
  p_month timestamptz
)
returns public.billing_snapshots
language plpgsql
security definer
as $$
declare
  v_month_bucket timestamptz;
  v_plan_id text;
  v_price_job numeric;
  v_price_ai numeric;
  v_price_video numeric;
  v_total_jobs numeric;
  v_total_ai_cost numeric;
  v_total_video_minutes numeric;
  v_total_amount numeric;
  v_row public.billing_snapshots%rowtype;
begin
  v_month_bucket := date_trunc('month', p_month);

  if exists (
    select 1 from public.billing_snapshots
    where tenant_id = p_tenant_id and month_bucket = v_month_bucket
  ) then
    raise exception 'Invoice already generated for this tenant and month';
  end if;

  select t.plan into v_plan_id
  from public.tenants t
  where t.id = p_tenant_id;

  if v_plan_id is null then
    raise exception 'Tenant not found';
  end if;

  select p.price_per_job, p.price_per_ai_cost, p.price_per_video_minute
  into v_price_job, v_price_ai, v_price_video
  from public.plans p
  where p.id = v_plan_id;

  if v_price_job is null then
    raise exception 'Plan not found: %', v_plan_id;
  end if;

  select
    coalesce(sum(quantity) filter (where event_type = 'job_completed'), 0),
    coalesce(sum(quantity) filter (where event_type = 'ai_cost'), 0),
    coalesce(sum(quantity) filter (where event_type = 'video_minutes'), 0)
  into v_total_jobs, v_total_ai_cost, v_total_video_minutes
  from public.usage_events
  where tenant_id = p_tenant_id
    and date_trunc('month', created_at) = v_month_bucket;

  v_total_amount := v_total_jobs * v_price_job
                 + v_total_ai_cost * v_price_ai
                 + v_total_video_minutes * v_price_video;

  insert into public.billing_snapshots (
    tenant_id,
    month_bucket,
    total_jobs,
    total_ai_cost,
    total_video_minutes,
    total_amount
  )
  values (
    p_tenant_id,
    v_month_bucket,
    v_total_jobs,
    v_total_ai_cost,
    v_total_video_minutes,
    v_total_amount
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- === 20250223800000_overage_engine_v1.sql ===
-- Soft limits + overage engine v1: allow_overage on tenants, overage_job events, overage charge in billing.

-- 1. Add overage settings to tenants
alter table public.tenants
  add column if not exists allow_overage boolean not null default false,
  add column if not exists overage_multiplier numeric not null default 1.5;

-- 2. Extend usage_events.event_type to include 'overage_job'
alter table public.usage_events
  drop constraint if exists usage_events_event_type_check;
alter table public.usage_events
  add constraint usage_events_event_type_check
  check (event_type in ('job_completed', 'ai_cost', 'video_minutes', 'overage_job'));

-- 3. create_analysis_job: when quota exceeded, allow if allow_overage and record overage_job event
create or replace function public.create_analysis_job(
  p_tenant_id uuid,
  p_media_id uuid,
  p_priority text default 'normal'
)
returns public.analysis_jobs
language plpgsql
security definer
as $$
declare
  concurrent_count integer;
  hourly_count integer;
  max_concurrent integer;
  max_hourly integer;
  allow_overage boolean;
  is_overage boolean := false;
  new_job public.analysis_jobs;
begin

  select t.max_concurrent_jobs, t.max_jobs_per_hour, t.allow_overage
  into max_concurrent, max_hourly, allow_overage
  from public.tenants t
  where t.id = p_tenant_id
  for update;

  if max_concurrent is null then
    raise exception 'Tenant not found';
  end if;

  select count(*)
  into concurrent_count
  from public.analysis_jobs
  where tenant_id = p_tenant_id
    and status in ('pending','processing');

  if concurrent_count >= max_concurrent then
    if not allow_overage then
      raise exception 'Concurrent job limit exceeded';
    end if;
    is_overage := true;
  end if;

  select count(*)
  into hourly_count
  from public.analysis_jobs
  where tenant_id = p_tenant_id
    and started_at >= date_trunc('hour', now());

  if hourly_count >= max_hourly then
    if not allow_overage then
      raise exception 'Hourly job limit exceeded';
    end if;
    is_overage := true;
  end if;

  insert into public.analysis_jobs (
    tenant_id,
    media_id,
    status,
    priority
  )
  values (
    p_tenant_id,
    p_media_id,
    'pending',
    p_priority
  )
  returning *
  into new_job;

  if is_overage then
    insert into public.usage_events (tenant_id, job_id, event_type, quantity)
    values (p_tenant_id, new_job.id, 'overage_job', 1);
  end if;

  return new_job;
end;
$$;

-- 4. generate_monthly_invoice: add overage charge (overage_jobs * price_per_job * overage_multiplier)
create or replace function public.generate_monthly_invoice(
  p_tenant_id uuid,
  p_month timestamptz
)
returns public.billing_snapshots
language plpgsql
security definer
as $$
declare
  v_month_bucket timestamptz;
  v_plan_id text;
  v_price_job numeric;
  v_price_ai numeric;
  v_price_video numeric;
  v_overage_multiplier numeric;
  v_total_jobs numeric;
  v_total_ai_cost numeric;
  v_total_video_minutes numeric;
  v_overage_jobs numeric;
  v_base_amount numeric;
  v_overage_charge numeric;
  v_total_amount numeric;
  v_row public.billing_snapshots%rowtype;
begin
  v_month_bucket := date_trunc('month', p_month);

  if exists (
    select 1 from public.billing_snapshots
    where tenant_id = p_tenant_id and month_bucket = v_month_bucket
  ) then
    raise exception 'Invoice already generated for this tenant and month';
  end if;

  select t.plan, t.overage_multiplier into v_plan_id, v_overage_multiplier
  from public.tenants t
  where t.id = p_tenant_id;

  if v_plan_id is null then
    raise exception 'Tenant not found';
  end if;

  select p.price_per_job, p.price_per_ai_cost, p.price_per_video_minute
  into v_price_job, v_price_ai, v_price_video
  from public.plans p
  where p.id = v_plan_id;

  if v_price_job is null then
    raise exception 'Plan not found: %', v_plan_id;
  end if;

  select
    coalesce(sum(quantity) filter (where event_type = 'job_completed'), 0),
    coalesce(sum(quantity) filter (where event_type = 'ai_cost'), 0),
    coalesce(sum(quantity) filter (where event_type = 'video_minutes'), 0),
    coalesce(sum(quantity) filter (where event_type = 'overage_job'), 0)
  into v_total_jobs, v_total_ai_cost, v_total_video_minutes, v_overage_jobs
  from public.usage_events
  where tenant_id = p_tenant_id
    and date_trunc('month', created_at) = v_month_bucket;

  v_base_amount := v_total_jobs * v_price_job
                 + v_total_ai_cost * v_price_ai
                 + v_total_video_minutes * v_price_video;

  v_overage_charge := v_overage_jobs * v_price_job * v_overage_multiplier;
  v_total_amount := v_base_amount + v_overage_charge;

  insert into public.billing_snapshots (
    tenant_id,
    month_bucket,
    total_jobs,
    total_ai_cost,
    total_video_minutes,
    total_amount
  )
  values (
    p_tenant_id,
    v_month_bucket,
    v_total_jobs,
    v_total_ai_cost,
    v_total_video_minutes,
    v_total_amount
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- === 20250223900000_invoice_lifecycle_v1.sql ===
-- Invoice lifecycle v1: status, issued_at, paid_at, external_invoice_id, issue/paid RPCs, overdue cron, quota block.

-- 1. Extend billing_snapshots with lifecycle fields
alter table public.billing_snapshots
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'issued', 'overdue', 'paid')),
  add column if not exists issued_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists external_invoice_id text;

create index if not exists idx_billing_snapshots_status on public.billing_snapshots(status);

-- 2. issue_invoice(snapshot_id): draft → issued
create or replace function public.issue_invoice(p_snapshot_id uuid)
returns public.billing_snapshots
language plpgsql
security definer
as $$
declare
  v_row public.billing_snapshots%rowtype;
begin
  update public.billing_snapshots
  set status = 'issued',
      issued_at = now()
  where id = p_snapshot_id
    and status = 'draft';

  if not found then
    raise exception 'Snapshot not found or not in draft status';
  end if;

  select * into v_row from public.billing_snapshots where id = p_snapshot_id;
  return v_row;
end;
$$;

-- 3. mark_invoice_paid(snapshot_id): issued or overdue → paid
create or replace function public.mark_invoice_paid(p_snapshot_id uuid)
returns public.billing_snapshots
language plpgsql
security definer
as $$
declare
  v_row public.billing_snapshots%rowtype;
begin
  update public.billing_snapshots
  set status = 'paid',
      paid_at = now()
  where id = p_snapshot_id
    and status in ('issued', 'overdue');

  if not found then
    raise exception 'Snapshot not found or not in issued/overdue status';
  end if;

  select * into v_row from public.billing_snapshots where id = p_snapshot_id;
  return v_row;
end;
$$;

-- 4. Mark issued invoices older than 14 days as overdue (for daily cron)
create or replace function public.mark_overdue_invoices()
returns integer
language plpgsql
security definer
as $$
declare
  v_affected integer;
begin
  update public.billing_snapshots
  set status = 'overdue'
  where status = 'issued'
    and issued_at is not null
    and issued_at < now() - interval '14 days';

  get diagnostics v_affected = row_count;
  return v_affected;
end;
$$;

-- 5. Daily cron: run mark_overdue_invoices at 02:00
select cron.schedule(
  'mark_overdue_invoices',
  '0 2 * * *',
  $$SELECT public.mark_overdue_invoices()$$
);

-- 6. create_analysis_job: block job creation if tenant has any overdue invoice
create or replace function public.create_analysis_job(
  p_tenant_id uuid,
  p_media_id uuid,
  p_priority text default 'normal'
)
returns public.analysis_jobs
language plpgsql
security definer
as $$
declare
  concurrent_count integer;
  hourly_count integer;
  max_concurrent integer;
  max_hourly integer;
  allow_overage boolean;
  is_overage boolean := false;
  new_job public.analysis_jobs;
begin

  select t.max_concurrent_jobs, t.max_jobs_per_hour, t.allow_overage
  into max_concurrent, max_hourly, allow_overage
  from public.tenants t
  where t.id = p_tenant_id
  for update;

  if max_concurrent is null then
    raise exception 'Tenant not found';
  end if;

  if exists (
    select 1 from public.billing_snapshots
    where tenant_id = p_tenant_id and status = 'overdue'
  ) then
    raise exception 'Tenant has overdue invoice; job creation blocked';
  end if;

  select count(*)
  into concurrent_count
  from public.analysis_jobs
  where tenant_id = p_tenant_id
    and status in ('pending','processing');

  if concurrent_count >= max_concurrent then
    if not allow_overage then
      raise exception 'Concurrent job limit exceeded';
    end if;
    is_overage := true;
  end if;

  select count(*)
  into hourly_count
  from public.analysis_jobs
  where tenant_id = p_tenant_id
    and started_at >= date_trunc('hour', now());

  if hourly_count >= max_hourly then
    if not allow_overage then
      raise exception 'Hourly job limit exceeded';
    end if;
    is_overage := true;
  end if;

  insert into public.analysis_jobs (
    tenant_id,
    media_id,
    status,
    priority
  )
  values (
    p_tenant_id,
    p_media_id,
    'pending',
    p_priority
  )
  returning *
  into new_job;

  if is_overage then
    insert into public.usage_events (tenant_id, job_id, event_type, quantity)
    values (p_tenant_id, new_job.id, 'overage_job', 1);
  end if;

  return new_job;
end;
$$;

-- === 20250224000000_stripe_integration_v1.sql ===
-- Stripe integration v1: billing_snapshots Stripe IDs, payments table, idempotent process_stripe_payment RPC.

-- 1. Extend billing_snapshots with Stripe references
alter table public.billing_snapshots
  add column if not exists stripe_invoice_id text,
  add column if not exists stripe_payment_intent_id text;

-- 2. Payments table: one row per Stripe event (idempotent by stripe_event_id)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  snapshot_id uuid not null references public.billing_snapshots(id) on delete restrict,
  stripe_event_id text not null,
  amount numeric not null,
  currency text not null,
  status text not null,
  created_at timestamptz not null default now(),
  unique (stripe_event_id)
);

create index idx_payments_tenant_id on public.payments(tenant_id);
create index idx_payments_snapshot_id on public.payments(snapshot_id);

alter table public.payments enable row level security;
create policy "Allow all for payments" on public.payments for all using (true) with check (true);

-- 3. process_stripe_payment: idempotent by stripe_event_id; insert payment, mark snapshot paid
create or replace function public.process_stripe_payment(
  p_stripe_event_id text,
  p_snapshot_id uuid,
  p_amount numeric,
  p_currency text,
  p_status text,
  p_stripe_payment_intent_id text default null,
  p_stripe_invoice_id text default null
)
returns public.payments
language plpgsql
security definer
as $$
declare
  v_tenant_id uuid;
  v_payment public.payments%rowtype;
begin
  -- Idempotent: already processed this event
  select * into v_payment
  from public.payments
  where stripe_event_id = p_stripe_event_id;

  if found then
    return v_payment;
  end if;

  -- Resolve tenant from snapshot
  select tenant_id into v_tenant_id
  from public.billing_snapshots
  where id = p_snapshot_id;

  if v_tenant_id is null then
    raise exception 'Snapshot not found';
  end if;

  -- Insert payment
  insert into public.payments (tenant_id, snapshot_id, stripe_event_id, amount, currency, status)
  values (v_tenant_id, p_snapshot_id, p_stripe_event_id, p_amount, p_currency, p_status)
  returning * into v_payment;

  -- Mark snapshot as paid (only if in issued/overdue)
  update public.billing_snapshots
  set status = 'paid',
      paid_at = now(),
      stripe_payment_intent_id = coalesce(p_stripe_payment_intent_id, stripe_payment_intent_id),
      stripe_invoice_id = coalesce(p_stripe_invoice_id, stripe_invoice_id)
  where id = p_snapshot_id
    and status in ('issued', 'overdue');

  return v_payment;
end;
$$;

-- === 20250224100000_revenue_intelligence_v1.sql ===
-- Revenue Intelligence v1: MRR, active tenants, churn, ARPU, plan-level revenue from paid billing_snapshots only.

-- 1. monthly_revenue (MRR): total revenue per month from paid snapshots
create or replace view public.monthly_revenue as
select
  date_trunc('month', paid_at) as month,
  coalesce(sum(total_amount), 0) as revenue
from public.billing_snapshots
where status = 'paid'
  and paid_at is not null
group by date_trunc('month', paid_at);

-- 2. active_tenants: one row per (month, tenant_id) with at least one paid snapshot in that month
create or replace view public.active_tenants as
select distinct
  date_trunc('month', paid_at) as month,
  tenant_id
from public.billing_snapshots
where status = 'paid'
  and paid_at is not null;

-- 3. monthly_churn: tenants active in previous month but not in current month (churn_month = first month inactive)
create or replace view public.monthly_churn as
with active as (
  select distinct date_trunc('month', paid_at) as month, tenant_id
  from public.billing_snapshots
  where status = 'paid' and paid_at is not null
)
select
  (a.month + interval '1 month') as churn_month,
  a.tenant_id
from active a
where not exists (
  select 1 from active b
  where b.month = a.month + interval '1 month'
    and b.tenant_id = a.tenant_id
);

-- 4. arpu: average revenue per active tenant per month
create or replace view public.arpu as
select
  date_trunc('month', paid_at) as month,
  sum(total_amount) / nullif(count(distinct tenant_id), 0) as arpu
from public.billing_snapshots
where status = 'paid'
  and paid_at is not null
group by date_trunc('month', paid_at);

-- 5. plan_monthly_revenue: plan-level revenue and active tenant count per month
create or replace view public.plan_monthly_revenue as
select
  date_trunc('month', b.paid_at) as month,
  t.plan,
  coalesce(sum(b.total_amount), 0) as revenue,
  count(distinct b.tenant_id) as active_tenant_count
from public.billing_snapshots b
join public.tenants t on t.id = b.tenant_id
where b.status = 'paid'
  and b.paid_at is not null
group by date_trunc('month', b.paid_at), t.plan;

-- === 20250224200000_unit_economics_v1.sql ===
-- Unit Economics v1: ai_cost_events table, monthly AI cost per tenant, monthly gross margin (revenue - ai_cost).

-- 1. ai_cost_events: one row per AI usage cost event
create table if not exists public.ai_cost_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  job_id uuid references public.analysis_jobs(id) on delete set null,
  model_name text not null,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  cost_usd numeric not null,
  created_at timestamptz not null default now()
);

create index idx_ai_cost_events_tenant_id on public.ai_cost_events(tenant_id);
create index idx_ai_cost_events_created_at on public.ai_cost_events(created_at);
create index idx_ai_cost_events_job_id on public.ai_cost_events(job_id);

alter table public.ai_cost_events enable row level security;
create policy "Allow all for ai_cost_events" on public.ai_cost_events for all using (true) with check (true);

-- 2. monthly_ai_cost: sum of cost_usd per tenant per month (by created_at)
create or replace view public.monthly_ai_cost as
select
  date_trunc('month', created_at) as month,
  tenant_id,
  coalesce(sum(cost_usd), 0) as cost_usd
from public.ai_cost_events
group by date_trunc('month', created_at), tenant_id;

-- 3. monthly_margin: revenue (paid snapshots) minus total AI cost per month; one row per month
create or replace view public.monthly_margin as
select
  coalesce(r.month, c.month) as month,
  coalesce(r.revenue, 0) as revenue,
  coalesce(c.ai_cost, 0) as ai_cost,
  coalesce(r.revenue, 0) - coalesce(c.ai_cost, 0) as margin
from (
  select date_trunc('month', paid_at) as month, sum(total_amount) as revenue
  from public.billing_snapshots
  where status = 'paid' and paid_at is not null
  group by date_trunc('month', paid_at)
) r
full outer join (
  select date_trunc('month', created_at) as month, sum(cost_usd) as ai_cost
  from public.ai_cost_events
  group by date_trunc('month', created_at)
) c on r.month = c.month;

-- === 20250224300000_dynamic_pricing_v1.sql ===
-- Dynamic Pricing v1: pricing_rules by margin tier, tenant_dynamic_pricing view, overage multiplier override in generate_monthly_invoice.

-- 1. pricing_rules: margin bands (min_margin inclusive) → overage_multiplier
create table if not exists public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  min_margin numeric not null,
  overage_multiplier numeric not null
);

create unique index uniq_pricing_rules_min_margin on public.pricing_rules(min_margin);
create index idx_pricing_rules_min_margin_desc on public.pricing_rules(min_margin desc);

alter table public.pricing_rules enable row level security;
create policy "Allow all for pricing_rules" on public.pricing_rules for all using (true) with check (true);

-- Seed: low margin → higher multiplier; high margin → lower multiplier
insert into public.pricing_rules (min_margin, overage_multiplier)
values
  (100, 1.0),
  (50, 1.25),
  (0, 1.5),
  (-999999, 2.0)
on conflict (min_margin) do nothing;

-- 2. tenant_dynamic_pricing: per (tenant_id, month) → margin and effective_overage_multiplier
create or replace view public.tenant_dynamic_pricing as
with tenant_months as (
  select tenant_id, date_trunc('month', paid_at) as month
  from public.billing_snapshots
  where status = 'paid' and paid_at is not null
  union
  select tenant_id, month from public.monthly_ai_cost
),
tenant_revenue as (
  select tenant_id, date_trunc('month', paid_at) as month, sum(total_amount) as revenue
  from public.billing_snapshots
  where status = 'paid' and paid_at is not null
  group by tenant_id, date_trunc('month', paid_at)
),
tenant_cost as (
  select tenant_id, month, cost_usd from public.monthly_ai_cost
)
select
  tm.tenant_id,
  tm.month,
  coalesce(tr.revenue, 0) - coalesce(tc.cost_usd, 0) as margin,
  coalesce(
    (
      select pr.overage_multiplier
      from public.pricing_rules pr
      where pr.min_margin <= (coalesce(tr.revenue, 0) - coalesce(tc.cost_usd, 0))
      order by pr.min_margin desc
      limit 1
    ),
    t.overage_multiplier
  ) as effective_overage_multiplier
from tenant_months tm
join public.tenants t on t.id = tm.tenant_id
left join tenant_revenue tr on tr.tenant_id = tm.tenant_id and tr.month = tm.month
left join tenant_cost tc on tc.tenant_id = tm.tenant_id and tc.month = tm.month;

-- 3. generate_monthly_invoice: use effective_overage_multiplier from tenant_dynamic_pricing (prior month margin) when available
create or replace function public.generate_monthly_invoice(
  p_tenant_id uuid,
  p_month timestamptz
)
returns public.billing_snapshots
language plpgsql
security definer
as $$
declare
  v_month_bucket timestamptz;
  v_plan_id text;
  v_price_job numeric;
  v_price_ai numeric;
  v_price_video numeric;
  v_overage_multiplier numeric;
  v_total_jobs numeric;
  v_total_ai_cost numeric;
  v_total_video_minutes numeric;
  v_overage_jobs numeric;
  v_base_amount numeric;
  v_overage_charge numeric;
  v_total_amount numeric;
  v_row public.billing_snapshots%rowtype;
begin
  v_month_bucket := date_trunc('month', p_month);

  if exists (
    select 1 from public.billing_snapshots
    where tenant_id = p_tenant_id and month_bucket = v_month_bucket
  ) then
    raise exception 'Invoice already generated for this tenant and month';
  end if;

  -- Base overage_multiplier from tenant; override from tenant_dynamic_pricing (prior month) when available
  select t.plan, t.overage_multiplier into v_plan_id, v_overage_multiplier
  from public.tenants t
  where t.id = p_tenant_id;

  if v_plan_id is null then
    raise exception 'Tenant not found';
  end if;

  select coalesce(
    (select dp.effective_overage_multiplier
     from public.tenant_dynamic_pricing dp
     where dp.tenant_id = p_tenant_id
       and dp.month = v_month_bucket - interval '1 month'
     limit 1),
    v_overage_multiplier
  ) into v_overage_multiplier;

  select p.price_per_job, p.price_per_ai_cost, p.price_per_video_minute
  into v_price_job, v_price_ai, v_price_video
  from public.plans p
  where p.id = v_plan_id;

  if v_price_job is null then
    raise exception 'Plan not found: %', v_plan_id;
  end if;

  select
    coalesce(sum(quantity) filter (where event_type = 'job_completed'), 0),
    coalesce(sum(quantity) filter (where event_type = 'ai_cost'), 0),
    coalesce(sum(quantity) filter (where event_type = 'video_minutes'), 0),
    coalesce(sum(quantity) filter (where event_type = 'overage_job'), 0)
  into v_total_jobs, v_total_ai_cost, v_total_video_minutes, v_overage_jobs
  from public.usage_events
  where tenant_id = p_tenant_id
    and date_trunc('month', created_at) = v_month_bucket;

  v_base_amount := v_total_jobs * v_price_job
                 + v_total_ai_cost * v_price_ai
                 + v_total_video_minutes * v_price_video;

  v_overage_charge := v_overage_jobs * v_price_job * v_overage_multiplier;
  v_total_amount := v_base_amount + v_overage_charge;

  insert into public.billing_snapshots (
    tenant_id,
    month_bucket,
    total_jobs,
    total_ai_cost,
    total_video_minutes,
    total_amount
  )
  values (
    p_tenant_id,
    v_month_bucket,
    v_total_jobs,
    v_total_ai_cost,
    v_total_video_minutes,
    v_total_amount
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- === 20250224400000_workload_control_v1.sql ===
-- Workload Control v1: global capacity limit, atomic increment on job create and decrement on job complete.

-- 1. system_capacity: single row (id = 1), holds global concurrent job limit and current count
create table if not exists public.system_capacity (
  id integer primary key default 1 check (id = 1),
  max_concurrent_jobs integer not null,
  current_jobs integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.system_capacity (id, max_concurrent_jobs, current_jobs)
values (1, 100, 0)
on conflict (id) do nothing;

alter table public.system_capacity enable row level security;
create policy "Allow all for system_capacity" on public.system_capacity for all using (true) with check (true);

-- 2. create_analysis_job: lock system_capacity, check capacity, increment current_jobs, then insert job
create or replace function public.create_analysis_job(
  p_tenant_id uuid,
  p_media_id uuid,
  p_priority text default 'normal'
)
returns public.analysis_jobs
language plpgsql
security definer
as $$
declare
  concurrent_count integer;
  hourly_count integer;
  max_concurrent integer;
  max_hourly integer;
  allow_overage boolean;
  is_overage boolean := false;
  new_job public.analysis_jobs;
  v_cap public.system_capacity%rowtype;
begin

  select t.max_concurrent_jobs, t.max_jobs_per_hour, t.allow_overage
  into max_concurrent, max_hourly, allow_overage
  from public.tenants t
  where t.id = p_tenant_id
  for update;

  if max_concurrent is null then
    raise exception 'Tenant not found';
  end if;

  if exists (
    select 1 from public.billing_snapshots
    where tenant_id = p_tenant_id and status = 'overdue'
  ) then
    raise exception 'Tenant has overdue invoice; job creation blocked';
  end if;

  select count(*)
  into concurrent_count
  from public.analysis_jobs
  where tenant_id = p_tenant_id
    and status in ('pending','processing');

  if concurrent_count >= max_concurrent then
    if not allow_overage then
      raise exception 'Concurrent job limit exceeded';
    end if;
    is_overage := true;
  end if;

  select count(*)
  into hourly_count
  from public.analysis_jobs
  where tenant_id = p_tenant_id
    and started_at >= date_trunc('hour', now());

  if hourly_count >= max_hourly then
    if not allow_overage then
      raise exception 'Hourly job limit exceeded';
    end if;
    is_overage := true;
  end if;

  -- Global capacity: lock row, check, increment atomically
  select * into v_cap
  from public.system_capacity
  where id = 1
  for update;

  if v_cap.current_jobs >= v_cap.max_concurrent_jobs then
    raise exception 'Global capacity exceeded';
  end if;

  update public.system_capacity
  set current_jobs = current_jobs + 1,
      updated_at = now()
  where id = 1;

  insert into public.analysis_jobs (
    tenant_id,
    media_id,
    status,
    priority
  )
  values (
    p_tenant_id,
    p_media_id,
    'pending',
    p_priority
  )
  returning *
  into new_job;

  if is_overage then
    insert into public.usage_events (tenant_id, job_id, event_type, quantity)
    values (p_tenant_id, new_job.id, 'overage_job', 1);
  end if;

  return new_job;
end;
$$;

-- 3. complete_analysis_job: decrement current_jobs atomically (never below zero)
create or replace function public.complete_analysis_job(
  p_job_id uuid,
  p_stage text,
  p_completion_percent integer,
  p_risk_level text,
  p_detected_issues text[],
  p_recommendations text[],
  p_frame_count integer default null,
  p_ai_cost numeric default 0.01,
  p_video_minutes numeric default 0
)
returns void
language plpgsql
security definer
as $$
declare
  v_tenant_id uuid;
  v_media_type text;
begin
  if not exists (
    select 1 from public.analysis_jobs
    where id = p_job_id and status = 'processing'
  ) then
    raise exception 'Job not in processing state';
  end if;

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
  where j.id = p_job_id;

  update public.analysis_jobs
  set status = 'completed',
      finished_at = now()
  where id = p_job_id;

  -- Global capacity: decrement atomically (floor at 0)
  update public.system_capacity
  set current_jobs = greatest(0, current_jobs - 1),
      updated_at = now()
  where id = 1;

  -- Usage: get tenant and media type for this job
  select j.tenant_id, m.type into v_tenant_id, v_media_type
  from public.analysis_jobs j
  join public.media m on m.id = j.media_id
  where j.id = p_job_id;

  insert into public.usage_events (tenant_id, job_id, event_type, quantity)
  values
    (v_tenant_id, p_job_id, 'job_completed', 1),
    (v_tenant_id, p_job_id, 'ai_cost', p_ai_cost);

  if v_media_type = 'video' and p_video_minutes > 0 then
    insert into public.usage_events (tenant_id, job_id, event_type, quantity)
    values (v_tenant_id, p_job_id, 'video_minutes', p_video_minutes);
  end if;
end;
$$;

-- === 20250224500000_distributed_worker_pool_v1.sql ===
-- Distributed Worker Pool v1: status 'queued', priority_order, dequeue_job() with FOR UPDATE SKIP LOCKED.

-- 1. Extend analysis_jobs.status to include 'queued'
alter table public.analysis_jobs
  drop constraint if exists analysis_jobs_status_check;
alter table public.analysis_jobs
  add constraint analysis_jobs_status_check
  check (status in ('pending', 'queued', 'processing', 'completed', 'failed'));

-- 2. Add integer priority for dequeue ordering (higher = chosen first)
alter table public.analysis_jobs
  add column if not exists priority_order integer not null default 0;

create index if not exists idx_analysis_jobs_queued_priority_started
  on public.analysis_jobs (status, priority_order desc, started_at)
  where status = 'queued';

-- 3. dequeue_job(): select one queued job, lock it, set processing, return row
create or replace function public.dequeue_job()
returns public.analysis_jobs
language plpgsql
security definer
as $$
declare
  v_job public.analysis_jobs%rowtype;
begin
  with selected as (
    select id
    from public.analysis_jobs
    where status = 'queued'
    order by priority_order desc, started_at asc
    limit 1
    for update skip locked
  ),
  updated as (
    update public.analysis_jobs j
    set status = 'processing'
    from selected s
    where j.id = s.id
    returning j.*
  )
  select * into v_job from updated;

  return v_job;
end;
$$;

-- 4. create_analysis_job: insert as 'queued', set priority_order from p_priority, count queued in limits
create or replace function public.create_analysis_job(
  p_tenant_id uuid,
  p_media_id uuid,
  p_priority text default 'normal'
)
returns public.analysis_jobs
language plpgsql
security definer
as $$
declare
  concurrent_count integer;
  hourly_count integer;
  max_concurrent integer;
  max_hourly integer;
  allow_overage boolean;
  is_overage boolean := false;
  new_job public.analysis_jobs;
  v_cap public.system_capacity%rowtype;
  v_priority_order integer;
begin

  v_priority_order := case p_priority when 'high' then 2 when 'normal' then 1 when 'low' then 0 else 0 end;

  select t.max_concurrent_jobs, t.max_jobs_per_hour, t.allow_overage
  into max_concurrent, max_hourly, allow_overage
  from public.tenants t
  where t.id = p_tenant_id
  for update;

  if max_concurrent is null then
    raise exception 'Tenant not found';
  end if;

  if exists (
    select 1 from public.billing_snapshots
    where tenant_id = p_tenant_id and status = 'overdue'
  ) then
    raise exception 'Tenant has overdue invoice; job creation blocked';
  end if;

  select count(*)
  into concurrent_count
  from public.analysis_jobs
  where tenant_id = p_tenant_id
    and status in ('pending', 'queued', 'processing');

  if concurrent_count >= max_concurrent then
    if not allow_overage then
      raise exception 'Concurrent job limit exceeded';
    end if;
    is_overage := true;
  end if;

  select count(*)
  into hourly_count
  from public.analysis_jobs
  where tenant_id = p_tenant_id
    and started_at >= date_trunc('hour', now());

  if hourly_count >= max_hourly then
    if not allow_overage then
      raise exception 'Hourly job limit exceeded';
    end if;
    is_overage := true;
  end if;

  select * into v_cap
  from public.system_capacity
  where id = 1
  for update;

  if v_cap.current_jobs >= v_cap.max_concurrent_jobs then
    raise exception 'Global capacity exceeded';
  end if;

  update public.system_capacity
  set current_jobs = current_jobs + 1,
      updated_at = now()
  where id = 1;

  insert into public.analysis_jobs (
    tenant_id,
    media_id,
    status,
    priority,
    priority_order
  )
  values (
    p_tenant_id,
    p_media_id,
    'queued',
    p_priority,
    v_priority_order
  )
  returning *
  into new_job;

  if is_overage then
    insert into public.usage_events (tenant_id, job_id, event_type, quantity)
    values (p_tenant_id, new_job.id, 'overage_job', 1);
  end if;

  return new_job;
end;
$$;

-- 5. mark_stale_jobs_failed: include 'queued' so queued jobs can time out
create or replace function public.mark_stale_jobs_failed(p_timeout_minutes integer default 15)
returns integer
language plpgsql
security definer
as $$
declare
  affected integer;
begin
  update public.analysis_jobs
  set status = 'failed',
      error_message = 'Timeout',
      finished_at = now()
  where status in ('pending', 'queued', 'processing')
    and started_at < now() - (p_timeout_minutes || ' minutes')::interval;

  get diagnostics affected = row_count;

  insert into public.job_sweep_log (affected_rows)
  values (affected);

  return affected;
end;
$$;

-- === 20250224600000_worker_crash_recovery_v1.sql ===
-- Worker Heartbeat + Crash Recovery v1: workers table, worker_id on jobs, heartbeat RPC, recover_dead_workers, cron.

-- 1. workers table
create table if not exists public.workers (
  id uuid primary key,
  name text not null default '',
  last_heartbeat timestamptz not null default now(),
  status text not null default 'online'
  check (status in ('online', 'offline'))
);

create index idx_workers_last_heartbeat on public.workers(last_heartbeat);
create index idx_workers_status on public.workers(status);

alter table public.workers enable row level security;
create policy "Allow all for workers" on public.workers for all using (true) with check (true);

-- 2. Add worker_id to analysis_jobs (set when job is dequeued by a worker)
alter table public.analysis_jobs
  add column if not exists worker_id uuid references public.workers(id) on delete set null;

create index idx_analysis_jobs_worker_id on public.analysis_jobs(worker_id);

-- 3. worker_heartbeat(worker_id): upsert last_heartbeat and status = 'online'
create or replace function public.worker_heartbeat(p_worker_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.workers (id, name, last_heartbeat, status)
  values (p_worker_id, coalesce(p_worker_id::text, ''), now(), 'online')
  on conflict (id) do update
  set last_heartbeat = now(),
      status = 'online';
end;
$$;

-- 4. dequeue_job: accept optional worker_id and set it on the job when claiming
create or replace function public.dequeue_job(p_worker_id uuid default null)
returns public.analysis_jobs
language plpgsql
security definer
as $$
declare
  v_job public.analysis_jobs%rowtype;
begin
  with selected as (
    select id
    from public.analysis_jobs
    where status = 'queued'
    order by priority_order desc, started_at asc
    limit 1
    for update skip locked
  ),
  updated as (
    update public.analysis_jobs j
    set status = 'processing',
        worker_id = p_worker_id
    from selected s
    where j.id = s.id
    returning j.*
  )
  select * into v_job from updated;

  return v_job;
end;
$$;

-- 5. recover_dead_workers(timeout_seconds): requeue jobs of workers with stale heartbeat, then mark those workers offline; return requeued count
create or replace function public.recover_dead_workers(p_timeout_seconds integer default 120)
returns integer
language plpgsql
security definer
as $$
declare
  v_affected integer;
begin
  -- Requeue jobs that are processing and assigned to workers with no recent heartbeat
  with dead_workers as (
    select id from public.workers
    where last_heartbeat < now() - (p_timeout_seconds || ' seconds')::interval
  )
  update public.analysis_jobs j
  set status = 'queued',
      worker_id = null
  from dead_workers d
  where j.worker_id = d.id
    and j.status = 'processing';

  get diagnostics v_affected = row_count;

  -- Mark those workers offline
  update public.workers
  set status = 'offline'
  where last_heartbeat < now() - (p_timeout_seconds || ' seconds')::interval;

  return v_affected;
end;
$$;

-- 6. Cron: run recover_dead_workers every 1 minute (timeout 120 seconds)
select cron.schedule(
  'recover_dead_workers',
  '* * * * *',
  $$SELECT public.recover_dead_workers(120)$$
);

-- === 20250224700000_retry_engine_v1.sql ===
-- Retry Engine + Dead Letter Queue v1: retry_count, next_retry_at, last_error, status 'dead', retry_job RPC, dequeue filter, dead_letter_jobs view.

-- 1. Extend analysis_jobs: retry fields and status 'dead'
alter table public.analysis_jobs
  add column if not exists retry_count integer not null default 0,
  add column if not exists next_retry_at timestamptz,
  add column if not exists last_error text;

alter table public.analysis_jobs
  drop constraint if exists analysis_jobs_status_check;
alter table public.analysis_jobs
  add constraint analysis_jobs_status_check
  check (status in ('pending', 'queued', 'processing', 'completed', 'failed', 'dead'));

create index if not exists idx_analysis_jobs_next_retry_at on public.analysis_jobs(next_retry_at)
  where status = 'queued';

-- 2. retry_job(job_id, error, max_retries): increment retry_count, backoff, or move to dead
create or replace function public.retry_job(
  p_job_id uuid,
  p_error text,
  p_max_retries integer default 3
)
returns public.analysis_jobs
language plpgsql
security definer
as $$
declare
  v_row public.analysis_jobs%rowtype;
begin
  update public.analysis_jobs
  set retry_count = retry_count + 1,
      last_error = p_error,
      status = case
        when retry_count + 1 > p_max_retries then 'dead'
        else 'queued'
      end,
      next_retry_at = case
        when retry_count + 1 > p_max_retries then null
        else now() + (power(2, retry_count + 1) || ' minutes')::interval
      end,
      worker_id = case when retry_count + 1 > p_max_retries then worker_id else null end
  where id = p_job_id
    and status in ('processing', 'failed');

  if not found then
    raise exception 'Job not found or not in processing/failed status';
  end if;

  select * into v_row from public.analysis_jobs where id = p_job_id;
  return v_row;
end;
$$;

-- 3. dequeue_job: only fetch jobs where (next_retry_at is null or next_retry_at <= now())
create or replace function public.dequeue_job(p_worker_id uuid default null)
returns public.analysis_jobs
language plpgsql
security definer
as $$
declare
  v_job public.analysis_jobs%rowtype;
begin
  with selected as (
    select id
    from public.analysis_jobs
    where status = 'queued'
      and (next_retry_at is null or next_retry_at <= now())
    order by priority_order desc, started_at asc
    limit 1
    for update skip locked
  ),
  updated as (
    update public.analysis_jobs j
    set status = 'processing',
        worker_id = p_worker_id
    from selected s
    where j.id = s.id
    returning j.*
  )
  select * into v_job from updated;

  return v_job;
end;
$$;

-- 4. dead_letter_jobs view
create or replace view public.dead_letter_jobs as
select *
from public.analysis_jobs
where status = 'dead';

-- === 20250224800000_idempotent_execution_v1.sql ===
-- Idempotent Execution Guard v1: execution_token, execution_started_at, claim_job_execution, complete/retry/recover updates.

-- 1. Extend analysis_jobs
alter table public.analysis_jobs
  add column if not exists execution_token uuid,
  add column if not exists execution_started_at timestamptz;

-- 2. claim_job_execution(job_id, worker_id): set execution_token if null; return true if claimed, false otherwise
create or replace function public.claim_job_execution(p_job_id uuid, p_worker_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_updated integer;
begin
  update public.analysis_jobs
  set execution_token = gen_random_uuid(),
      execution_started_at = now(),
      worker_id = p_worker_id
  where id = p_job_id
    and status = 'processing'
    and execution_token is null;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

-- 3. complete_analysis_job: require execution_token not null
create or replace function public.complete_analysis_job(
  p_job_id uuid,
  p_stage text,
  p_completion_percent integer,
  p_risk_level text,
  p_detected_issues text[],
  p_recommendations text[],
  p_frame_count integer default null,
  p_ai_cost numeric default 0.01,
  p_video_minutes numeric default 0
)
returns void
language plpgsql
security definer
as $$
declare
  v_tenant_id uuid;
  v_media_type text;
begin
  if not exists (
    select 1 from public.analysis_jobs
    where id = p_job_id and status = 'processing' and execution_token is not null
  ) then
    raise exception 'Job not in processing state or execution not claimed';
  end if;

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
  where j.id = p_job_id;

  update public.analysis_jobs
  set status = 'completed',
      finished_at = now()
  where id = p_job_id;

  update public.system_capacity
  set current_jobs = greatest(0, current_jobs - 1),
      updated_at = now()
  where id = 1;

  select j.tenant_id, m.type into v_tenant_id, v_media_type
  from public.analysis_jobs j
  join public.media m on m.id = j.media_id
  where j.id = p_job_id;

  insert into public.usage_events (tenant_id, job_id, event_type, quantity)
  values
    (v_tenant_id, p_job_id, 'job_completed', 1),
    (v_tenant_id, p_job_id, 'ai_cost', p_ai_cost);

  if v_media_type = 'video' and p_video_minutes > 0 then
    insert into public.usage_events (tenant_id, job_id, event_type, quantity)
    values (v_tenant_id, p_job_id, 'video_minutes', p_video_minutes);
  end if;
end;
$$;

-- 4. retry_job: reset execution_token (and execution_started_at) when requeueing or moving to dead
create or replace function public.retry_job(
  p_job_id uuid,
  p_error text,
  p_max_retries integer default 3
)
returns public.analysis_jobs
language plpgsql
security definer
as $$
declare
  v_row public.analysis_jobs%rowtype;
begin
  update public.analysis_jobs
  set retry_count = retry_count + 1,
      last_error = p_error,
      execution_token = null,
      execution_started_at = null,
      status = case
        when retry_count + 1 > p_max_retries then 'dead'
        else 'queued'
      end,
      next_retry_at = case
        when retry_count + 1 > p_max_retries then null
        else now() + (power(2, retry_count + 1) || ' minutes')::interval
      end,
      worker_id = case when retry_count + 1 > p_max_retries then worker_id else null end
  where id = p_job_id
    and status in ('processing', 'failed');

  if not found then
    raise exception 'Job not found or not in processing/failed status';
  end if;

  select * into v_row from public.analysis_jobs where id = p_job_id;
  return v_row;
end;
$$;

-- 5. recover_dead_workers: clear execution_token when requeueing so job can be claimed again
create or replace function public.recover_dead_workers(p_timeout_seconds integer default 120)
returns integer
language plpgsql
security definer
as $$
declare
  v_affected integer;
begin
  with dead_workers as (
    select id from public.workers
    where last_heartbeat < now() - (p_timeout_seconds || ' seconds')::interval
  )
  update public.analysis_jobs j
  set status = 'queued',
      worker_id = null,
      execution_token = null,
      execution_started_at = null
  from dead_workers d
  where j.worker_id = d.id
    and j.status = 'processing';

  get diagnostics v_affected = row_count;

  update public.workers
  set status = 'offline'
  where last_heartbeat < now() - (p_timeout_seconds || ' seconds')::interval;

  return v_affected;
end;
$$;

-- === 20250224900000_observability_tracing_v1.sql ===
-- Observability + Distributed Tracing v1: job_events table, job_trace and worker_metrics views.

-- 1. job_events: one row per lifecycle step
create table if not exists public.job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.analysis_jobs(id) on delete cascade,
  worker_id uuid references public.workers(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_job_events_job_id on public.job_events(job_id);
create index idx_job_events_worker_id on public.job_events(worker_id);
create index idx_job_events_created_at on public.job_events(created_at desc);
create index idx_job_events_event_type on public.job_events(event_type);

alter table public.job_events enable row level security;
create policy "Allow all for job_events" on public.job_events for all using (true) with check (true);

-- Optional: RPC for workers to record events (validates event_type)
create or replace function public.record_job_event(
  p_job_id uuid,
  p_worker_id uuid,
  p_event_type text,
  p_payload jsonb default '{}'
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  if p_event_type not in ('dequeued', 'claimed', 'execution_started', 'completed', 'failed', 'requeued') then
    raise exception 'Invalid event_type: %', p_event_type;
  end if;
  insert into public.job_events (job_id, worker_id, event_type, payload)
  values (p_job_id, p_worker_id, p_event_type, coalesce(p_payload, '{}'))
  returning id into v_id;
  return v_id;
end;
$$;

-- 2. job_trace: per-job lifecycle summary and execution duration
create or replace view public.job_trace as
select
  job_id,
  min(created_at) as first_event_at,
  max(created_at) as last_event_at,
  count(*)::integer as event_count,
  extract(epoch from (
    max(created_at) filter (where event_type in ('completed', 'failed', 'requeued'))
    - min(created_at) filter (where event_type in ('claimed', 'execution_started'))
  )) as execution_duration_seconds
from public.job_events
group by job_id;

-- 3. worker_metrics: completed count, failed count, last activity per worker
create or replace view public.worker_metrics as
select
  worker_id,
  count(*) filter (where event_type = 'completed')::integer as completed_jobs,
  count(*) filter (where event_type = 'failed')::integer as failed_jobs,
  count(*) filter (where event_type = 'requeued')::integer as requeued_jobs,
  max(created_at) as last_activity
from public.job_events
where worker_id is not null
group by worker_id;

-- === 20250225000000_multi_region_v1.sql ===
-- Multi-Region Processing v1: regions, region_capacity, analysis_jobs.region_id, dequeue by region, failover reassignment.

-- 1. regions table
create table if not exists public.regions (
  id text primary key,
  is_active boolean not null default true,
  max_capacity integer not null default 100
);

alter table public.regions enable row level security;
create policy "Allow all for regions" on public.regions for all using (true) with check (true);

insert into public.regions (id, is_active, max_capacity)
values ('default', true, 100)
on conflict (id) do nothing;

-- 2. analysis_jobs.region_id (nullable: null = unassigned, picked by dequeue_job(null))
alter table public.analysis_jobs
  add column if not exists region_id text references public.regions(id) on delete set null;

create index idx_analysis_jobs_region_id on public.analysis_jobs(region_id);

-- 3. region_capacity: per-region running count and cap
create table if not exists public.region_capacity (
  region_id text primary key references public.regions(id) on delete cascade,
  max_concurrent integer not null,
  current_running integer not null default 0
);

alter table public.region_capacity enable row level security;
create policy "Allow all for region_capacity" on public.region_capacity for all using (true) with check (true);

insert into public.region_capacity (region_id, max_concurrent, current_running)
values ('default', 100, 0)
on conflict (region_id) do nothing;

-- 4. dequeue_job(p_region_id, p_worker_id): only fetch jobs for that region; respect region capacity when region_id given
create or replace function public.dequeue_job(p_region_id text default null, p_worker_id uuid default null)
returns public.analysis_jobs
language plpgsql
security definer
as $$
declare
  v_job public.analysis_jobs%rowtype;
  v_cap record;
begin
  if p_region_id is not null then
    select rc.region_id, rc.max_concurrent, rc.current_running
    into v_cap
    from public.region_capacity rc
    join public.regions r on r.id = rc.region_id
    where rc.region_id = p_region_id
      and r.is_active = true
    for update;

    if not found then
      return null;
    end if;

    if v_cap.current_running >= v_cap.max_concurrent then
      return null;
    end if;

    update public.region_capacity
    set current_running = current_running + 1
    where region_id = p_region_id;
  end if;

  with selected as (
    select id
    from public.analysis_jobs
    where status = 'queued'
      and (next_retry_at is null or next_retry_at <= now())
      and (p_region_id is null and region_id is null or region_id = p_region_id)
    order by priority_order desc, started_at asc
    limit 1
    for update skip locked
  ),
  updated as (
    update public.analysis_jobs j
    set status = 'processing',
        worker_id = p_worker_id
    from selected s
    where j.id = s.id
    returning j.*
  )
  select * into v_job from updated;

  if not found and p_region_id is not null then
    update public.region_capacity
    set current_running = greatest(0, current_running - 1)
    where region_id = p_region_id;
  end if;

  return v_job;
end;
$$;

-- 5. complete_analysis_job: decrement region_capacity for job's region when present
create or replace function public.complete_analysis_job(
  p_job_id uuid,
  p_stage text,
  p_completion_percent integer,
  p_risk_level text,
  p_detected_issues text[],
  p_recommendations text[],
  p_frame_count integer default null,
  p_ai_cost numeric default 0.01,
  p_video_minutes numeric default 0
)
returns void
language plpgsql
security definer
as $$
declare
  v_tenant_id uuid;
  v_media_type text;
  v_region_id text;
begin
  if not exists (
    select 1 from public.analysis_jobs
    where id = p_job_id and status = 'processing' and execution_token is not null
  ) then
    raise exception 'Job not in processing state or execution not claimed';
  end if;

  select region_id into v_region_id
  from public.analysis_jobs
  where id = p_job_id;

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
  where j.id = p_job_id;

  update public.analysis_jobs
  set status = 'completed',
      finished_at = now()
  where id = p_job_id;

  update public.system_capacity
  set current_jobs = greatest(0, current_jobs - 1),
      updated_at = now()
  where id = 1;

  if v_region_id is not null then
    update public.region_capacity
    set current_running = greatest(0, current_running - 1)
    where region_id = v_region_id;
  end if;

  select j.tenant_id, m.type into v_tenant_id, v_media_type
  from public.analysis_jobs j
  join public.media m on m.id = j.media_id
  where j.id = p_job_id;

  insert into public.usage_events (tenant_id, job_id, event_type, quantity)
  values
    (v_tenant_id, p_job_id, 'job_completed', 1),
    (v_tenant_id, p_job_id, 'ai_cost', p_ai_cost);

  if v_media_type = 'video' and p_video_minutes > 0 then
    insert into public.usage_events (tenant_id, job_id, event_type, quantity)
    values (v_tenant_id, p_job_id, 'video_minutes', p_video_minutes);
  end if;
end;
$$;

-- 6. recover_dead_workers: decrement region_capacity per region by count of requeued jobs, then requeue
create or replace function public.recover_dead_workers(p_timeout_seconds integer default 120)
returns integer
language plpgsql
security definer
as $$
declare
  v_affected integer;
begin
  with dead_workers as (
    select id from public.workers
    where last_heartbeat < now() - (p_timeout_seconds || ' seconds')::interval
  ),
  by_region as (
    select j.region_id, count(*) as cnt
    from public.analysis_jobs j
    join dead_workers d on d.id = j.worker_id
    where j.status = 'processing' and j.region_id is not null
    group by j.region_id
  )
  update public.region_capacity rc
  set current_running = greatest(0, current_running - by_region.cnt)
  from by_region
  where rc.region_id = by_region.region_id;

  with dead_workers as (
    select id from public.workers
    where last_heartbeat < now() - (p_timeout_seconds || ' seconds')::interval
  )
  update public.analysis_jobs j
  set status = 'queued',
      worker_id = null,
      execution_token = null,
      execution_started_at = null
  from dead_workers d
  where j.worker_id = d.id
    and j.status = 'processing';

  get diagnostics v_affected = row_count;

  update public.workers
  set status = 'offline'
  where last_heartbeat < now() - (p_timeout_seconds || ' seconds')::interval;

  return v_affected;
end;
$$;

-- 7. retry_job: decrement region_capacity when requeueing (job was running in that region)
create or replace function public.retry_job(
  p_job_id uuid,
  p_error text,
  p_max_retries integer default 3
)
returns public.analysis_jobs
language plpgsql
security definer
as $$
declare
  v_row public.analysis_jobs%rowtype;
  v_region_id text;
  v_new_status text;
begin
  select region_id into v_region_id
  from public.analysis_jobs
  where id = p_job_id and status in ('processing', 'failed');

  update public.analysis_jobs
  set retry_count = retry_count + 1,
      last_error = p_error,
      execution_token = null,
      execution_started_at = null,
      status = case
        when retry_count + 1 > p_max_retries then 'dead'
        else 'queued'
      end,
      next_retry_at = case
        when retry_count + 1 > p_max_retries then null
        else now() + (power(2, retry_count + 1) || ' minutes')::interval
      end,
      worker_id = case when retry_count + 1 > p_max_retries then worker_id else null end
  where id = p_job_id
    and status in ('processing', 'failed');

  if not found then
    raise exception 'Job not found or not in processing/failed status';
  end if;

  select status into v_new_status from public.analysis_jobs where id = p_job_id;
  if v_region_id is not null and v_new_status = 'queued' then
    update public.region_capacity
    set current_running = greatest(0, current_running - 1)
    where region_id = v_region_id;
  end if;

  select * into v_row from public.analysis_jobs where id = p_job_id;
  return v_row;
end;
$$;

-- 8. Failover: reassign queued jobs from inactive regions to the first active region
create or replace function public.reassign_queued_jobs_from_inactive_regions()
returns integer
language plpgsql
security definer
as $$
declare
  v_failover_region_id text;
  v_affected integer;
begin
  select id into v_failover_region_id
  from public.regions
  where is_active = true
  order by id
  limit 1;

  if v_failover_region_id is null then
    return 0;
  end if;

  update public.analysis_jobs
  set region_id = v_failover_region_id
  where status = 'queued'
    and region_id is not null
    and region_id in (select id from public.regions where is_active = false);

  get diagnostics v_affected = row_count;
  return v_affected;
end;
$$;

-- === 20250226100000_tenant_per_user.sql ===
-- One tenant per user: link tenants to auth.users for per-user cabinet and project isolation.
alter table public.tenants
  add column if not exists user_id uuid references auth.users(id) on delete cascade;
create unique index if not exists idx_tenants_user_id
  on public.tenants(user_id)
  where user_id is not null;

-- === 20250226200000_tenant_members_and_invitations.sql ===
create table if not exists public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  unique(tenant_id, user_id)
);
create index if not exists idx_tenant_members_tenant_id on public.tenant_members(tenant_id);
create index if not exists idx_tenant_members_user_id on public.tenant_members(user_id);
alter table public.tenant_members enable row level security;
create policy "Allow all for tenant_members" on public.tenant_members for all using (true) with check (true);
insert into public.tenant_members (tenant_id, user_id, role)
  select id, user_id, 'owner' from public.tenants where user_id is not null
  on conflict (tenant_id, user_id) do update set role = 'owner';
create table if not exists public.tenant_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member', 'viewer')),
  token uuid not null default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create unique index if not exists idx_tenant_invitations_token on public.tenant_invitations(token);
create index if not exists idx_tenant_invitations_tenant_id on public.tenant_invitations(tenant_id);
alter table public.tenant_invitations enable row level security;
create policy "Allow all for tenant_invitations" on public.tenant_invitations for all using (true) with check (true);

