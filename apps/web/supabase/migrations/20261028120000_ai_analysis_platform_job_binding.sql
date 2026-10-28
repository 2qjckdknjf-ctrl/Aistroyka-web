-- Bind durable AI image results from the platform job queue to ai_analysis without
-- inventing a second result table. Session analysis_jobs.job_id remains unchanged.
-- platform_job_id is unique when set so a successful write is idempotent on retry.

alter table public.ai_analysis
  add column if not exists platform_job_id uuid references public.jobs (id) on delete set null;

create unique index if not exists one_ai_analysis_per_platform_job
  on public.ai_analysis (platform_job_id)
  where platform_job_id is not null;

comment on column public.ai_analysis.platform_job_id is
  'Optional link to public.jobs for Worker report-media analysis; distinct from analysis_jobs.id.';
