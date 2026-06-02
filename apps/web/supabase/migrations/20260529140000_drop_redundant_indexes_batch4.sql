-- Batch 4: drop unused idx_fkfix_* on project_client_requests and project_documents.
-- Project-scoped list indexes remain (idx_*_project, idx_*_status, tenant indexes).
-- Actor/linked-entity FK helpers unused on pilot traffic; may surface unindexed_foreign_keys INFO.

drop index if exists public.idx_fkfix_project_client_requests_5aad4829f6;
drop index if exists public.idx_fkfix_project_client_requests_b671a448cf;
drop index if exists public.idx_fkfix_project_client_requests_da185dd5f8;
drop index if exists public.idx_fkfix_project_client_requests_e4ec4922d6;
drop index if exists public.idx_fkfix_project_client_requests_f2aa08285b;
drop index if exists public.idx_fkfix_project_documents_0b49e5ae98;
drop index if exists public.idx_fkfix_project_documents_1132f82aa4;
drop index if exists public.idx_fkfix_project_documents_51c13eca24;
drop index if exists public.idx_fkfix_project_documents_81bcdfc222;
drop index if exists public.idx_fkfix_project_documents_c6e8883c66;
