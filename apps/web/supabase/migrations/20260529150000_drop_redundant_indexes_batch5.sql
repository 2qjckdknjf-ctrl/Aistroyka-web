-- Batch 5: drop unused idx_fkfix_* on entity/commercial tables.
-- Project/tenant-scoped list indexes remain on each table.
-- ai_memory_records: drop tenant_id fkfix only (covered by composite indexes).

drop index if exists public.idx_fkfix_ai_memory_records_61fa6300ff;
drop index if exists public.idx_fkfix_ai_optimization_decisions_16ee85e039;
drop index if exists public.idx_fkfix_ai_optimization_decisions_b3e62e57f1;
drop index if exists public.idx_fkfix_ai_optimization_decisions_ecb54b3375;
drop index if exists public.idx_fkfix_customer_estimates_3265b3b9c2;
drop index if exists public.idx_fkfix_customer_estimates_7c24981e40;
drop index if exists public.idx_fkfix_customer_estimates_99aca5bd10;
drop index if exists public.idx_fkfix_governance_cases_25a8977bc7;
drop index if exists public.idx_fkfix_governance_cases_624769173c;
drop index if exists public.idx_fkfix_governance_cases_9af25d092a;
drop index if exists public.idx_fkfix_project_commercial_items_672d2335d5;
drop index if exists public.idx_fkfix_project_commercial_items_b35f7499b8;
drop index if exists public.idx_fkfix_project_commercial_items_fe6b5a415a;
drop index if exists public.idx_fkfix_project_issues_09ea59b5e6;
drop index if exists public.idx_fkfix_project_issues_6e3d24d32b;
drop index if exists public.idx_fkfix_project_issues_9ad84613e9;
