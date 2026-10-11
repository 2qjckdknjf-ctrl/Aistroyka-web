-- The trigger calls only the built-in now(); do not inherit a caller's path.
alter function public.set_field_daily_logs_updated_at()
  set search_path = pg_catalog;

-- The tenant-first index does not cover either of these foreign keys.
-- The new intake table is empty at the authorized pre-apply observation.
create index if not exists idx_customer_intake_created_by
  on public.customer_intake_drafts (created_by);
create index if not exists idx_customer_intake_project_id
  on public.customer_intake_drafts (project_id);
