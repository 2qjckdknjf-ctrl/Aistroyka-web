-- Split overlapping FOR ALL RLS policies (multiple_permissive_policies advisor).
-- Access semantics unchanged: SELECT policies stay; write policies cover insert/update/delete only.
-- Redundant deny-all ALL policies removed (writes remain denied without explicit allow).

drop policy if exists billing_customers_admin on public.billing_customers;
drop policy if exists billing_pilot_workspaces_all on public.billing_pilot_workspaces;
drop policy if exists billing_readiness_checkout_sessions_all on public.billing_readiness_checkout_sessions;
drop policy if exists billing_readiness_customers_all on public.billing_readiness_customers;
drop policy if exists billing_readiness_events_all on public.billing_readiness_events;
drop policy if exists billing_readiness_subscriptions_all on public.billing_readiness_subscriptions;
drop policy if exists billing_readiness_trial_state_all on public.billing_readiness_trial_state;
drop policy if exists entitlements_admin on public.entitlements;
drop policy if exists feature_flags_admin on public.feature_flags;
drop policy if exists privacy_settings_admin on public.privacy_settings;
drop policy if exists tenant_data_plane_admin on public.tenant_data_plane;
drop policy if exists tenant_feature_flags_admin on public.tenant_feature_flags;

drop policy if exists governance_case_projects_write on public.governance_case_projects;
create policy governance_case_projects_write_insert on public.governance_case_projects for insert with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy governance_case_projects_write_update on public.governance_case_projects for update using (is_internal_tenant_reader_for_tenant(tenant_id)) with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy governance_case_projects_write_delete on public.governance_case_projects for delete using (is_internal_tenant_reader_for_tenant(tenant_id));

drop policy if exists governance_cases_write on public.governance_cases;
create policy governance_cases_write_insert on public.governance_cases for insert with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy governance_cases_write_update on public.governance_cases for update using (is_internal_tenant_reader_for_tenant(tenant_id)) with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy governance_cases_write_delete on public.governance_cases for delete using (is_internal_tenant_reader_for_tenant(tenant_id));

drop policy if exists change_orders_write_internal on public.project_change_orders;
create policy change_orders_write_internal_insert on public.project_change_orders for insert with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy change_orders_write_internal_update on public.project_change_orders for update using (is_internal_tenant_reader_for_tenant(tenant_id)) with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy change_orders_write_internal_delete on public.project_change_orders for delete using (is_internal_tenant_reader_for_tenant(tenant_id));

drop policy if exists project_client_request_events_write_internal on public.project_client_request_events;
create policy project_client_request_events_write_internal_insert on public.project_client_request_events for insert with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy project_client_request_events_write_internal_update on public.project_client_request_events for update using (is_internal_tenant_reader_for_tenant(tenant_id)) with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy project_client_request_events_write_internal_delete on public.project_client_request_events for delete using (is_internal_tenant_reader_for_tenant(tenant_id));

drop policy if exists project_client_requests_write_internal on public.project_client_requests;
create policy project_client_requests_write_internal_insert on public.project_client_requests for insert with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy project_client_requests_write_internal_update on public.project_client_requests for update using (is_internal_tenant_reader_for_tenant(tenant_id)) with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy project_client_requests_write_internal_delete on public.project_client_requests for delete using (is_internal_tenant_reader_for_tenant(tenant_id));

drop policy if exists project_defects_write_internal on public.project_defects;
create policy project_defects_write_internal_insert on public.project_defects for insert with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy project_defects_write_internal_update on public.project_defects for update using (is_internal_tenant_reader_for_tenant(tenant_id)) with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy project_defects_write_internal_delete on public.project_defects for delete using (is_internal_tenant_reader_for_tenant(tenant_id));

drop policy if exists project_documents_write_internal on public.project_documents;
create policy project_documents_write_internal_insert on public.project_documents for insert with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy project_documents_write_internal_update on public.project_documents for update using (is_internal_tenant_reader_for_tenant(tenant_id)) with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy project_documents_write_internal_delete on public.project_documents for delete using (is_internal_tenant_reader_for_tenant(tenant_id));

drop policy if exists project_estimate_results_write_internal on public.project_estimate_results;
create policy project_estimate_results_write_internal_insert on public.project_estimate_results for insert with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy project_estimate_results_write_internal_update on public.project_estimate_results for update using (is_internal_tenant_reader_for_tenant(tenant_id)) with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy project_estimate_results_write_internal_delete on public.project_estimate_results for delete using (is_internal_tenant_reader_for_tenant(tenant_id));

drop policy if exists project_handover_write_internal on public.project_handover;
create policy project_handover_write_internal_insert on public.project_handover for insert with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy project_handover_write_internal_update on public.project_handover for update using (is_internal_tenant_reader_for_tenant(tenant_id)) with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy project_handover_write_internal_delete on public.project_handover for delete using (is_internal_tenant_reader_for_tenant(tenant_id));

drop policy if exists project_issues_write_internal on public.project_issues;
create policy project_issues_write_internal_insert on public.project_issues for insert with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy project_issues_write_internal_update on public.project_issues for update using (is_internal_tenant_reader_for_tenant(tenant_id)) with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy project_issues_write_internal_delete on public.project_issues for delete using (is_internal_tenant_reader_for_tenant(tenant_id));

drop policy if exists project_milestones_write_internal on public.project_milestones;
create policy project_milestones_write_internal_insert on public.project_milestones for insert with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy project_milestones_write_internal_update on public.project_milestones for update using (is_internal_tenant_reader_for_tenant(tenant_id)) with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy project_milestones_write_internal_delete on public.project_milestones for delete using (is_internal_tenant_reader_for_tenant(tenant_id));

drop policy if exists project_risks_write_internal on public.project_risks;
create policy project_risks_write_internal_insert on public.project_risks for insert with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy project_risks_write_internal_update on public.project_risks for update using (is_internal_tenant_reader_for_tenant(tenant_id)) with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy project_risks_write_internal_delete on public.project_risks for delete using (is_internal_tenant_reader_for_tenant(tenant_id));

drop policy if exists stakeholder_discussions_write_internal on public.project_stakeholder_discussions;
create policy stakeholder_discussions_write_internal_insert on public.project_stakeholder_discussions for insert with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy stakeholder_discussions_write_internal_update on public.project_stakeholder_discussions for update using (is_internal_tenant_reader_for_tenant(tenant_id)) with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy stakeholder_discussions_write_internal_delete on public.project_stakeholder_discussions for delete using (is_internal_tenant_reader_for_tenant(tenant_id));

drop policy if exists projects_write_internal on public.projects;
create policy projects_write_internal_insert on public.projects for insert with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy projects_write_internal_update on public.projects for update using (is_internal_tenant_reader_for_tenant(tenant_id)) with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy projects_write_internal_delete on public.projects for delete using (is_internal_tenant_reader_for_tenant(tenant_id));

drop policy if exists worker_day_write_internal on public.worker_day;
create policy worker_day_write_internal_insert on public.worker_day for insert with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy worker_day_write_internal_update on public.worker_day for update using (is_internal_tenant_reader_for_tenant(tenant_id)) with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy worker_day_write_internal_delete on public.worker_day for delete using (is_internal_tenant_reader_for_tenant(tenant_id));

drop policy if exists worker_reports_write_internal on public.worker_reports;
create policy worker_reports_write_internal_insert on public.worker_reports for insert with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy worker_reports_write_internal_update on public.worker_reports for update using (is_internal_tenant_reader_for_tenant(tenant_id)) with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy worker_reports_write_internal_delete on public.worker_reports for delete using (is_internal_tenant_reader_for_tenant(tenant_id));

drop policy if exists worker_tasks_write_internal on public.worker_tasks;
create policy worker_tasks_write_internal_insert on public.worker_tasks for insert with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy worker_tasks_write_internal_update on public.worker_tasks for update using (is_internal_tenant_reader_for_tenant(tenant_id)) with check (is_internal_tenant_reader_for_tenant(tenant_id));
create policy worker_tasks_write_internal_delete on public.worker_tasks for delete using (is_internal_tenant_reader_for_tenant(tenant_id));

drop policy if exists worker_report_media_write_internal on public.worker_report_media;
create policy worker_report_media_write_internal_insert on public.worker_report_media for insert with check ((report_id IN ( SELECT wr.id FROM worker_reports wr WHERE is_internal_tenant_reader_for_tenant(wr.tenant_id))));
create policy worker_report_media_write_internal_update on public.worker_report_media for update using ((report_id IN ( SELECT wr.id FROM worker_reports wr WHERE is_internal_tenant_reader_for_tenant(wr.tenant_id)))) with check ((report_id IN ( SELECT wr.id FROM worker_reports wr WHERE is_internal_tenant_reader_for_tenant(wr.tenant_id))));
create policy worker_report_media_write_internal_delete on public.worker_report_media for delete using ((report_id IN ( SELECT wr.id FROM worker_reports wr WHERE is_internal_tenant_reader_for_tenant(wr.tenant_id))));

