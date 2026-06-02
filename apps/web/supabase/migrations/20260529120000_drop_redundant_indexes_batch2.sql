-- Batch 2: drop redundant idx_fkfix_* on audit/event tables.
-- Each table keeps its primary entity timeline index (e.g. defect_id, request_id, document_id).
-- Denormalized tenant/project/actor fkfix indexes are unused on pilot traffic and duplicate RLS filter paths.

drop index if exists public.idx_fkfix_governance_case_events_164b153ca3;
drop index if exists public.idx_fkfix_governance_case_events_754af86392;
drop index if exists public.idx_fkfix_project_change_order_events_0ff3c4788a;
drop index if exists public.idx_fkfix_project_change_order_events_175f56b62e;
drop index if exists public.idx_fkfix_project_change_order_events_b6e843c605;
drop index if exists public.idx_fkfix_project_client_request_event_64e9ad48e9;
drop index if exists public.idx_fkfix_project_client_request_event_756db69e71;
drop index if exists public.idx_fkfix_project_client_request_event_8452f02609;
drop index if exists public.idx_fkfix_project_commercial_item_even_3a6f244b52;
drop index if exists public.idx_fkfix_project_commercial_item_even_5123e17a23;
drop index if exists public.idx_fkfix_project_commercial_item_even_c10b77bc77;
drop index if exists public.idx_fkfix_project_defect_events_903390580b;
drop index if exists public.idx_fkfix_project_defect_events_95b231319e;
drop index if exists public.idx_fkfix_project_defect_events_c623bcbf30;
drop index if exists public.idx_fkfix_project_document_events_c2a4986adb;
drop index if exists public.idx_fkfix_project_handover_events_7ac03f327d;
drop index if exists public.idx_fkfix_project_handover_events_a35c4aaa9a;
drop index if exists public.idx_fkfix_project_handover_events_c395161331;
drop index if exists public.idx_fkfix_project_stakeholder_discussi_484bc311f4;
drop index if exists public.idx_fkfix_project_stakeholder_discussi_7b42dd9d19;
drop index if exists public.idx_fkfix_project_stakeholder_discussi_b439ea2257;
drop index if exists public.idx_fkfix_report_approval_events_fc2c433d38;
drop index if exists public.idx_fkfix_ai_run_records_df7c76ebea;
