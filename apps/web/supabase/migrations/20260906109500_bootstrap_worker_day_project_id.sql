-- RELEASE HARDENING SECURITY WAVE 12
-- Live-schema compatibility bootstrap for worker_day.project_id.
--
-- Production reconciliation on 2026-09-06 found that historical migration
-- 20260407120000_worker_day_project_id.sql is absent from the live migration
-- ledger and public.worker_day.project_id is also absent. The later hardening
-- migration 20260906110000_project_ops_tenant_consistency.sql references that
-- column directly, so the ordered release migration batch would otherwise fail.
--
-- Recreate only the historical schema delta as an idempotent forward migration;
-- do not replay the old migration or any unrelated policy state.

alter table public.worker_day
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists idx_worker_day_tenant_project
  on public.worker_day(tenant_id, project_id)
  where project_id is not null;

comment on column public.worker_day.project_id is
  'Optional project context for worker day; forward-bootstrap required before release hardening project/tenant consistency policies.';
