-- Batch 7: final low-traffic idx_fkfix_* sweep.
-- Preserved (do not drop): push_outbox.tenant_id (idx_scan > 0),
-- worker_reports.day_id, worker_tasks.project_id, ai_memory_records FK helpers.

drop index if exists public.idx_fkfix_ai_analysis_1a10e8b495;
drop index if exists public.idx_fkfix_ai_eval_results_272bf53892;
drop index if exists public.idx_fkfix_ai_optimization_proposals_c1e0a427ff;
drop index if exists public.idx_fkfix_experiment_assignments_4fc498b717;
drop index if exists public.idx_fkfix_idempotency_keys_b40f5b531d;
drop index if exists public.idx_fkfix_sso_sessions_4171801eba;
drop index if exists public.idx_fkfix_tenants_2a43b9d5c1;
drop index if exists public.idx_fkfix_usage_events_c09054bdd8;
