-- Batch 1: drop redundant indexes covered by unique/PK or named indexes on same columns.
-- Conservative pass only; semantics unchanged (same query plans via remaining indexes).

drop index if exists public.idx_fkfix_ai_analysis_d8245c79d4;
drop index if exists public.idx_analysis_jobs_media_id;
drop index if exists public.idx_billing_pilot_workspaces_workspace;
drop index if exists public.idx_fkfix_manager_notifications_5cda5b4f15;
drop index if exists public.idx_fkfix_project_cost_items_f812fa5baa;
drop index if exists public.idx_fkfix_project_issues_3ee962c461;
drop index if exists public.idx_fkfix_project_stakeholders_bf2d87f5c8;
drop index if exists public.idx_fkfix_projects_bc64ba2644;
drop index if exists public.idx_proof_pack_shares_token;
drop index if exists public.idx_fkfix_stakeholder_notifications_81703a04ba;
drop index if exists public.idx_fkfix_support_ticket_messages_5a50d67e46;
drop index if exists public.idx_fkfix_tenants_6f96e9f667;
drop index if exists public.idx_user_identities_provider_user;
drop index if exists public.idx_user_telegram_links_tenant_user;
drop index if exists public.idx_worker_day_tenant_user_date;
drop index if exists public.idx_fkfix_worker_reports_6cc4d68e59;
drop index if exists public.idx_billing_snapshots_tenant_id;
drop index if exists public.idx_org_members_org;
drop index if exists public.idx_org_tenants_org;
drop index if exists public.idx_tenant_contractor_profiles_tenant;
drop index if exists public.idx_tenant_invitations_tenant_id;
drop index if exists public.idx_tenant_members_tenant_id;
drop index if exists public.idx_tenant_feature_flags_tenant;
