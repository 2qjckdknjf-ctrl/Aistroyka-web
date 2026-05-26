-- Drop unused non-FK helper indexes on internal deny-all tables.
-- Keep PK/UNIQUE and FK-covering indexes intact.

drop index if exists public.idx_ai_cost_events_created_at;

drop index if exists public.idx_billing_snapshots_month_bucket;
drop index if exists public.idx_billing_snapshots_status;

drop index if exists public.idx_pricing_rules_min_margin_desc;

drop index if exists public.idx_usage_events_created_at;
drop index if exists public.idx_usage_events_event_type;

drop index if exists public.idx_workers_status;
