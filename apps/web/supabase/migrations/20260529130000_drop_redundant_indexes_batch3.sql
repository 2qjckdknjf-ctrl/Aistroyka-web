-- Batch 3: drop unused idx_fkfix_* on project_defects and project_change_orders.
-- Primary list/filter paths use tenant_id+project_id composites and project_id indexes.
-- Linked-entity FK helper indexes are unused on pilot traffic; dropping may surface
-- unindexed_foreign_keys INFO advisories (acceptable tradeoff, same as batch 2).

drop index if exists public.idx_fkfix_project_change_orders_159d0c2b83;
drop index if exists public.idx_fkfix_project_change_orders_1d236ffbdb;
drop index if exists public.idx_fkfix_project_change_orders_20e4df7326;
drop index if exists public.idx_fkfix_project_change_orders_2d57fb9320;
drop index if exists public.idx_fkfix_project_change_orders_3621a56fe8;
drop index if exists public.idx_fkfix_project_change_orders_59af223dc0;
drop index if exists public.idx_fkfix_project_change_orders_63c0ecdd67;
drop index if exists public.idx_fkfix_project_change_orders_737880834f;
drop index if exists public.idx_fkfix_project_change_orders_95d2cf7d2b;
drop index if exists public.idx_fkfix_project_defects_0a947433f6;
drop index if exists public.idx_fkfix_project_defects_1299b9ac7e;
drop index if exists public.idx_fkfix_project_defects_2a5389b6ba;
drop index if exists public.idx_fkfix_project_defects_45b0f087f7;
drop index if exists public.idx_fkfix_project_defects_4c80079350;
drop index if exists public.idx_fkfix_project_defects_59d7c74509;
drop index if exists public.idx_fkfix_project_defects_5a2099489c;
drop index if exists public.idx_fkfix_project_defects_b0acb2e225;
drop index if exists public.idx_fkfix_project_defects_eeed840739;
