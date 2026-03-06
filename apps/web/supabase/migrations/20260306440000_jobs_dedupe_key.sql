-- Idempotent enqueue: optional dedupe_key per tenant (Phase 4.3).

alter table public.jobs add column if not exists dedupe_key text;

create unique index if not exists idx_jobs_tenant_dedupe on public.jobs(tenant_id, dedupe_key)
where dedupe_key is not null;
