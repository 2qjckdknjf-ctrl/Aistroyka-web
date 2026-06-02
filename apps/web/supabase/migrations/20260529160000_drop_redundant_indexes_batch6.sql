-- Batch 6: drop unused actor/linked idx_fkfix_* on entity and internal tables.
-- Project/tenant-scoped indexes remain. Skips hot-path sole-FK helpers
-- (worker_reports.day_id, worker_tasks.project_id, push_outbox.tenant_id).

drop index if exists public.idx_fkfix_project_handover_81a832e9b8;
drop index if exists public.idx_fkfix_project_handover_b73c6b519e;
drop index if exists public.idx_fkfix_project_risks_c47ba8b225;
drop index if exists public.idx_fkfix_project_cost_items_b61d1e8334;
drop index if exists public.idx_fkfix_project_estimate_results_9f2bf2e8d6;
drop index if exists public.idx_fkfix_project_stakeholder_discussi_a549d11dc0;
drop index if exists public.idx_fkfix_project_stakeholder_discussi_f238188d88;
drop index if exists public.idx_fkfix_project_stakeholders_4836f67469;
drop index if exists public.idx_fkfix_proof_pack_shares_41722eead4;
drop index if exists public.idx_fkfix_ai_run_records_d5b9e67f56;
drop index if exists public.idx_fkfix_worker_reports_0d2cb64a06;
drop index if exists public.idx_fkfix_ai_guide_events_66cbbdc845;
drop index if exists public.idx_fkfix_billing_pilot_workspaces_d4ba687335;
drop index if exists public.idx_fkfix_billing_readiness_checkout_s_fe5cf92bed;
drop index if exists public.idx_fkfix_plan_fit_recommendations_fb5eff71fd;
drop index if exists public.idx_fkfix_stakeholder_notifications_3c9697df8b;
drop index if exists public.idx_fkfix_workspace_plan_state_e22e37cac6;
