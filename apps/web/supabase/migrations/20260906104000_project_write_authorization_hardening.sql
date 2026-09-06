-- RELEASE HARDENING WAVE 1
-- Separate generic tenant read and write cohorts.
--
-- Current main uses is_internal_tenant_reader_for_tenant(...) in many write policies.
-- That helper intentionally includes viewer, so viewers can reach direct PostgREST
-- INSERT/UPDATE/DELETE paths even when application APIs deny them.
--
-- This migration preserves existing owner/admin/member write semantics while
-- explicitly excluding viewer/stakeholder. Sensitive commercial/project-role
-- paths are hardened separately in 20260906091000_harden_project_commercial_writes.sql.

create or replace function public.is_internal_tenant_writer_for_tenant(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenants t
    where t.id = p_tenant_id and t.user_id = (select auth.uid())
  )
  or exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner', 'admin', 'member')
  );
$$;

revoke all on function public.is_internal_tenant_writer_for_tenant(uuid) from public;
grant execute on function public.is_internal_tenant_writer_for_tenant(uuid) to authenticated, service_role;

comment on function public.is_internal_tenant_writer_for_tenant(uuid) is
  'Tenant write cohort: tenant owner or tenant member role owner/admin/member; viewer/stakeholder excluded.';

-- Governance

drop policy if exists governance_case_projects_write_insert on public.governance_case_projects;
drop policy if exists governance_case_projects_write_update on public.governance_case_projects;
drop policy if exists governance_case_projects_write_delete on public.governance_case_projects;
create policy governance_case_projects_write_insert on public.governance_case_projects for insert to authenticated with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy governance_case_projects_write_update on public.governance_case_projects for update to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id)) with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy governance_case_projects_write_delete on public.governance_case_projects for delete to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists governance_cases_write_insert on public.governance_cases;
drop policy if exists governance_cases_write_update on public.governance_cases;
drop policy if exists governance_cases_write_delete on public.governance_cases;
create policy governance_cases_write_insert on public.governance_cases for insert to authenticated with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy governance_cases_write_update on public.governance_cases for update to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id)) with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy governance_cases_write_delete on public.governance_cases for delete to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id));

-- Client requests

drop policy if exists project_client_request_events_write_internal_insert on public.project_client_request_events;
drop policy if exists project_client_request_events_write_internal_update on public.project_client_request_events;
drop policy if exists project_client_request_events_write_internal_delete on public.project_client_request_events;
create policy project_client_request_events_write_internal_insert on public.project_client_request_events for insert to authenticated with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy project_client_request_events_write_internal_update on public.project_client_request_events for update to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id)) with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy project_client_request_events_write_internal_delete on public.project_client_request_events for delete to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists project_client_requests_write_internal_insert on public.project_client_requests;
drop policy if exists project_client_requests_write_internal_update on public.project_client_requests;
drop policy if exists project_client_requests_write_internal_delete on public.project_client_requests;
create policy project_client_requests_write_internal_insert on public.project_client_requests for insert to authenticated with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy project_client_requests_write_internal_update on public.project_client_requests for update to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id)) with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy project_client_requests_write_internal_delete on public.project_client_requests for delete to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id));

-- Core project content

drop policy if exists project_documents_write_internal_insert on public.project_documents;
drop policy if exists project_documents_write_internal_update on public.project_documents;
drop policy if exists project_documents_write_internal_delete on public.project_documents;
create policy project_documents_write_internal_insert on public.project_documents for insert to authenticated with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy project_documents_write_internal_update on public.project_documents for update to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id)) with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy project_documents_write_internal_delete on public.project_documents for delete to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists project_estimate_results_write_internal_insert on public.project_estimate_results;
drop policy if exists project_estimate_results_write_internal_update on public.project_estimate_results;
drop policy if exists project_estimate_results_write_internal_delete on public.project_estimate_results;
create policy project_estimate_results_write_internal_insert on public.project_estimate_results for insert to authenticated with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy project_estimate_results_write_internal_update on public.project_estimate_results for update to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id)) with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy project_estimate_results_write_internal_delete on public.project_estimate_results for delete to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists project_handover_write_internal_insert on public.project_handover;
drop policy if exists project_handover_write_internal_update on public.project_handover;
drop policy if exists project_handover_write_internal_delete on public.project_handover;
create policy project_handover_write_internal_insert on public.project_handover for insert to authenticated with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy project_handover_write_internal_update on public.project_handover for update to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id)) with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy project_handover_write_internal_delete on public.project_handover for delete to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists project_issues_write_internal_insert on public.project_issues;
drop policy if exists project_issues_write_internal_update on public.project_issues;
drop policy if exists project_issues_write_internal_delete on public.project_issues;
create policy project_issues_write_internal_insert on public.project_issues for insert to authenticated with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy project_issues_write_internal_update on public.project_issues for update to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id)) with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy project_issues_write_internal_delete on public.project_issues for delete to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists project_milestones_write_internal_insert on public.project_milestones;
drop policy if exists project_milestones_write_internal_update on public.project_milestones;
drop policy if exists project_milestones_write_internal_delete on public.project_milestones;
create policy project_milestones_write_internal_insert on public.project_milestones for insert to authenticated with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy project_milestones_write_internal_update on public.project_milestones for update to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id)) with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy project_milestones_write_internal_delete on public.project_milestones for delete to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists project_risks_write_internal_insert on public.project_risks;
drop policy if exists project_risks_write_internal_update on public.project_risks;
drop policy if exists project_risks_write_internal_delete on public.project_risks;
create policy project_risks_write_internal_insert on public.project_risks for insert to authenticated with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy project_risks_write_internal_update on public.project_risks for update to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id)) with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy project_risks_write_internal_delete on public.project_risks for delete to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists stakeholder_discussions_write_internal_insert on public.project_stakeholder_discussions;
drop policy if exists stakeholder_discussions_write_internal_update on public.project_stakeholder_discussions;
drop policy if exists stakeholder_discussions_write_internal_delete on public.project_stakeholder_discussions;
create policy stakeholder_discussions_write_internal_insert on public.project_stakeholder_discussions for insert to authenticated with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy stakeholder_discussions_write_internal_update on public.project_stakeholder_discussions for update to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id)) with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy stakeholder_discussions_write_internal_delete on public.project_stakeholder_discussions for delete to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id));

-- Projects themselves: keep existing member-level create/update/delete semantics, but block viewer.

drop policy if exists projects_write_internal_insert on public.projects;
drop policy if exists projects_write_internal_update on public.projects;
drop policy if exists projects_write_internal_delete on public.projects;
create policy projects_write_internal_insert on public.projects for insert to authenticated with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy projects_write_internal_update on public.projects for update to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id)) with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy projects_write_internal_delete on public.projects for delete to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id));

-- Worker operational tables: member remains writable; viewer is read-only.

drop policy if exists worker_day_write_internal_insert on public.worker_day;
drop policy if exists worker_day_write_internal_update on public.worker_day;
drop policy if exists worker_day_write_internal_delete on public.worker_day;
create policy worker_day_write_internal_insert on public.worker_day for insert to authenticated with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy worker_day_write_internal_update on public.worker_day for update to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id)) with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy worker_day_write_internal_delete on public.worker_day for delete to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists worker_reports_write_internal_insert on public.worker_reports;
drop policy if exists worker_reports_write_internal_update on public.worker_reports;
drop policy if exists worker_reports_write_internal_delete on public.worker_reports;
create policy worker_reports_write_internal_insert on public.worker_reports for insert to authenticated with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy worker_reports_write_internal_update on public.worker_reports for update to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id)) with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy worker_reports_write_internal_delete on public.worker_reports for delete to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists worker_tasks_write_internal_insert on public.worker_tasks;
drop policy if exists worker_tasks_write_internal_update on public.worker_tasks;
drop policy if exists worker_tasks_write_internal_delete on public.worker_tasks;
create policy worker_tasks_write_internal_insert on public.worker_tasks for insert to authenticated with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy worker_tasks_write_internal_update on public.worker_tasks for update to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id)) with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy worker_tasks_write_internal_delete on public.worker_tasks for delete to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists worker_report_media_write_internal_insert on public.worker_report_media;
drop policy if exists worker_report_media_write_internal_update on public.worker_report_media;
drop policy if exists worker_report_media_write_internal_delete on public.worker_report_media;
create policy worker_report_media_write_internal_insert on public.worker_report_media
  for insert to authenticated with check (
    report_id in (
      select wr.id from public.worker_reports wr
      where public.is_internal_tenant_writer_for_tenant(wr.tenant_id)
    )
  );
create policy worker_report_media_write_internal_update on public.worker_report_media
  for update to authenticated using (
    report_id in (
      select wr.id from public.worker_reports wr
      where public.is_internal_tenant_writer_for_tenant(wr.tenant_id)
    )
  ) with check (
    report_id in (
      select wr.id from public.worker_reports wr
      where public.is_internal_tenant_writer_for_tenant(wr.tenant_id)
    )
  );
create policy worker_report_media_write_internal_delete on public.worker_report_media
  for delete to authenticated using (
    report_id in (
      select wr.id from public.worker_reports wr
      where public.is_internal_tenant_writer_for_tenant(wr.tenant_id)
    )
  );
