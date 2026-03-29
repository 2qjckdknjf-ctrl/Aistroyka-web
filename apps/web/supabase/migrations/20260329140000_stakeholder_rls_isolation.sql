-- Wave 4 Step 7 closure: data-plane isolation for portal-only stakeholders (tenant_members.role = stakeholder).
-- Replaces broad "any tenant_members row" predicates with internal roles OR explicit portal project scope.
-- Includes legacy remediation: viewer -> stakeholder where user has active project_stakeholders.

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER: read membership without RLS recursion)
-- ---------------------------------------------------------------------------

create or replace function public.is_internal_tenant_reader_for_tenant(p_tenant_id uuid)
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
      and tm.role in ('owner', 'admin', 'member', 'viewer')
  );
$$;

comment on function public.is_internal_tenant_reader_for_tenant(uuid) is
  'True for tenant owners and internal tenant_members roles; false for portal-only stakeholder role.';

create or replace function public.is_portal_stakeholder_for_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.project_stakeholders ps
    where ps.project_id = p_project_id
      and ps.user_id = (select auth.uid())
      and ps.status = 'active'
  );
$$;

comment on function public.is_portal_stakeholder_for_project(uuid) is
  'True when auth user is an active external stakeholder on the project.';

create or replace function public.is_portal_stakeholder_for_document(p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_documents pd
    where pd.id = p_document_id
      and public.is_portal_stakeholder_for_project(pd.project_id)
  );
$$;

revoke all on function public.is_internal_tenant_reader_for_tenant(uuid) from public;
revoke all on function public.is_portal_stakeholder_for_project(uuid) from public;
revoke all on function public.is_portal_stakeholder_for_document(uuid) from public;
grant execute on function public.is_internal_tenant_reader_for_tenant(uuid) to authenticated;
grant execute on function public.is_portal_stakeholder_for_project(uuid) to authenticated;
grant execute on function public.is_portal_stakeholder_for_document(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Legacy: tenant viewers who are active external stakeholders -> stakeholder
-- ---------------------------------------------------------------------------

update public.tenant_members tm
set role = 'stakeholder'
from public.project_stakeholders ps
where ps.user_id = tm.user_id
  and ps.tenant_id = tm.tenant_id
  and ps.status = 'active'
  and tm.role = 'viewer';

-- ---------------------------------------------------------------------------
-- projects: SELECT portal + internal; write internal (+ existing service policies unchanged)
-- ---------------------------------------------------------------------------

drop policy if exists projects_tenant on public.projects;
create policy projects_select_portal on public.projects for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
  or public.is_portal_stakeholder_for_project(id)
);
create policy projects_write_internal on public.projects for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

-- ---------------------------------------------------------------------------
-- Project-scoped tables: read portal + internal; write internal only
-- ---------------------------------------------------------------------------

drop policy if exists project_milestones_tenant on public.project_milestones;
create policy project_milestones_select_portal on public.project_milestones for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
  or public.is_portal_stakeholder_for_project(project_id)
);
create policy project_milestones_write_internal on public.project_milestones for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

drop policy if exists project_documents_tenant on public.project_documents;
create policy project_documents_select_portal on public.project_documents for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
  or public.is_portal_stakeholder_for_project(project_id)
);
create policy project_documents_write_internal on public.project_documents for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

drop policy if exists project_cost_items_tenant on public.project_cost_items;
create policy project_cost_items_select_portal on public.project_cost_items for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
  or public.is_portal_stakeholder_for_project(project_id)
);
create policy project_cost_items_write_internal on public.project_cost_items for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

drop policy if exists project_issues_tenant_member on public.project_issues;
create policy project_issues_select_portal on public.project_issues for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
  or public.is_portal_stakeholder_for_project(project_id)
);
create policy project_issues_write_internal on public.project_issues for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

drop policy if exists project_estimate_results_tenant on public.project_estimate_results;
create policy project_estimate_results_select_portal on public.project_estimate_results for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
  or public.is_portal_stakeholder_for_project(project_id)
);
create policy project_estimate_results_write_internal on public.project_estimate_results for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

drop policy if exists project_risks_tenant_member on public.project_risks;
create policy project_risks_select_portal on public.project_risks for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
  or public.is_portal_stakeholder_for_project(project_id)
);
create policy project_risks_write_internal on public.project_risks for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

-- ---------------------------------------------------------------------------
-- Client requests (project-scoped)
-- ---------------------------------------------------------------------------

drop policy if exists project_client_requests_tenant_member on public.project_client_requests;
create policy project_client_requests_select_portal on public.project_client_requests for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
  or public.is_portal_stakeholder_for_project(project_id)
);
create policy project_client_requests_write_internal on public.project_client_requests for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

drop policy if exists project_client_request_events_tenant_member on public.project_client_request_events;
create policy project_client_request_events_select_portal on public.project_client_request_events for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
  or public.is_portal_stakeholder_for_project(project_id)
);
create policy project_client_request_events_write_internal on public.project_client_request_events for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

-- ---------------------------------------------------------------------------
-- Document events (document_id only — join via project_documents)
-- ---------------------------------------------------------------------------

drop policy if exists project_document_events_select on public.project_document_events;
drop policy if exists project_document_events_insert on public.project_document_events;

create policy project_document_events_select on public.project_document_events for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
  or public.is_portal_stakeholder_for_document(document_id)
);

create policy project_document_events_insert on public.project_document_events for insert with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

-- ---------------------------------------------------------------------------
-- project_stakeholders: managers + invitee email + activated user
-- ---------------------------------------------------------------------------

drop policy if exists project_stakeholders_tenant_member on public.project_stakeholders;
create policy project_stakeholders_access on public.project_stakeholders for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
  or tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
  or user_id = (select auth.uid())
  or lower(trim(coalesce(email, ''))) = lower(trim(coalesce((select auth.jwt() ->> 'email'), '')))
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
  or tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
  or user_id = (select auth.uid())
  or lower(trim(coalesce(email, ''))) = lower(trim(coalesce((select auth.jwt() ->> 'email'), '')))
);

-- ---------------------------------------------------------------------------
-- Worker / upload (project-scoped where applicable)
-- ---------------------------------------------------------------------------

drop policy if exists worker_reports_tenant on public.worker_reports;
-- worker_reports has no project_id; portal scope via optional task_id -> worker_tasks.project_id
create policy worker_reports_select_portal on public.worker_reports for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
  or (
    task_id is not null
    and exists (
      select 1 from public.worker_tasks wt
      where wt.id = worker_reports.task_id
        and wt.project_id is not null
        and public.is_portal_stakeholder_for_project(wt.project_id)
    )
  )
);
create policy worker_reports_write_internal on public.worker_reports for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

drop policy if exists worker_report_media_via_report on public.worker_report_media;
create policy worker_report_media_select_portal on public.worker_report_media for select using (
  report_id in (
    select wr.id from public.worker_reports wr
    where public.is_internal_tenant_reader_for_tenant(wr.tenant_id)
       or (
         wr.task_id is not null
         and exists (
           select 1 from public.worker_tasks wt
           where wt.id = wr.task_id
             and wt.project_id is not null
             and public.is_portal_stakeholder_for_project(wt.project_id)
         )
       )
  )
);
create policy worker_report_media_write_internal on public.worker_report_media for all using (
  report_id in (
    select wr.id from public.worker_reports wr
    where public.is_internal_tenant_reader_for_tenant(wr.tenant_id)
  )
) with check (
  report_id in (
    select wr.id from public.worker_reports wr
    where public.is_internal_tenant_reader_for_tenant(wr.tenant_id)
  )
);

drop policy if exists worker_day_tenant on public.worker_day;
-- worker_day has no project_id; raw day rows are internal-only (portal uses curated APIs)
create policy worker_day_select_portal on public.worker_day for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);
create policy worker_day_write_internal on public.worker_day for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

drop policy if exists worker_tasks_tenant on public.worker_tasks;
create policy worker_tasks_select_portal on public.worker_tasks for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
  or public.is_portal_stakeholder_for_project(project_id)
);
create policy worker_tasks_write_internal on public.worker_tasks for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

drop policy if exists upload_sessions_tenant on public.upload_sessions;
create policy upload_sessions_internal on public.upload_sessions for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

-- ---------------------------------------------------------------------------
-- project_members / task_assignments — internal only (no raw stakeholder browse)
-- ---------------------------------------------------------------------------

drop policy if exists project_members_tenant on public.project_members;
create policy project_members_internal on public.project_members for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

drop policy if exists task_assignments_tenant on public.task_assignments;
create policy task_assignments_internal on public.task_assignments for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

-- ---------------------------------------------------------------------------
-- Tenant-wide internal tables (deny portal stakeholder)
-- ---------------------------------------------------------------------------

drop policy if exists report_approval_events_select on public.report_approval_events;
drop policy if exists report_approval_events_insert on public.report_approval_events;
create policy report_approval_events_select on public.report_approval_events for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);
create policy report_approval_events_insert on public.report_approval_events for insert with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

drop policy if exists ai_run_records_tenant on public.ai_run_records;
drop policy if exists ai_run_records_insert on public.ai_run_records;
create policy ai_run_records_select on public.ai_run_records for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);
create policy ai_run_records_insert on public.ai_run_records for insert with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

drop policy if exists ai_feedback_tenant on public.ai_feedback_records;
drop policy if exists ai_feedback_insert on public.ai_feedback_records;
create policy ai_feedback_select on public.ai_feedback_records for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);
create policy ai_feedback_insert on public.ai_feedback_records for insert with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

drop policy if exists ai_improvement_tenant on public.ai_improvement_candidates;
drop policy if exists ai_improvement_insert on public.ai_improvement_candidates;
create policy ai_improvement_select on public.ai_improvement_candidates for select using (
  tenant_id is null or public.is_internal_tenant_reader_for_tenant(tenant_id)
);
create policy ai_improvement_insert on public.ai_improvement_candidates for insert with check (true);

drop policy if exists ai_opt_proposals_tenant on public.ai_optimization_proposals;
drop policy if exists ai_opt_proposals_insert on public.ai_optimization_proposals;
create policy ai_opt_proposals_select on public.ai_optimization_proposals for select using (
  tenant_id is null or public.is_internal_tenant_reader_for_tenant(tenant_id)
);
create policy ai_opt_proposals_insert on public.ai_optimization_proposals for insert with check (true);

drop policy if exists ai_memory_records_select on public.ai_memory_records;
drop policy if exists ai_memory_records_insert on public.ai_memory_records;
drop policy if exists ai_memory_records_update on public.ai_memory_records;
create policy ai_memory_records_select on public.ai_memory_records for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);
create policy ai_memory_records_insert on public.ai_memory_records for insert with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);
create policy ai_memory_records_update on public.ai_memory_records for update using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

drop policy if exists ai_policy_decisions_tenant on public.ai_policy_decisions;
drop policy if exists ai_policy_decisions_insert on public.ai_policy_decisions;
create policy ai_policy_decisions_select on public.ai_policy_decisions for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);
create policy ai_policy_decisions_insert on public.ai_policy_decisions for insert with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

-- plan_fit (from 20260319100000 — policy names may vary; drop known)
drop policy if exists plan_fit_recommendations_select on public.plan_fit_recommendations;
drop policy if exists plan_fit_recommendations_insert on public.plan_fit_recommendations;
drop policy if exists workspace_plan_state_select on public.workspace_plan_state;
drop policy if exists workspace_plan_state_insert on public.workspace_plan_state;
drop policy if exists workspace_plan_state_update on public.workspace_plan_state;

create policy plan_fit_recommendations_select on public.plan_fit_recommendations for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);
create policy plan_fit_recommendations_insert on public.plan_fit_recommendations for insert with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

create policy workspace_plan_state_select on public.workspace_plan_state for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);
create policy workspace_plan_state_insert on public.workspace_plan_state for insert with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);
create policy workspace_plan_state_update on public.workspace_plan_state for update using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

-- ---------------------------------------------------------------------------
-- Billing readiness (workspace_id = tenant id)
-- ---------------------------------------------------------------------------

drop policy if exists billing_readiness_customers_select on public.billing_readiness_customers;
drop policy if exists billing_readiness_subscriptions_select on public.billing_readiness_subscriptions;
drop policy if exists billing_readiness_checkout_sessions_select on public.billing_readiness_checkout_sessions;
drop policy if exists billing_readiness_events_select on public.billing_readiness_events;
drop policy if exists billing_readiness_trial_state_select on public.billing_readiness_trial_state;

create policy billing_readiness_customers_select on public.billing_readiness_customers for select using (
  workspace_id in (select id from public.tenants where user_id = (select auth.uid()))
  or public.is_internal_tenant_reader_for_tenant(workspace_id)
);
create policy billing_readiness_subscriptions_select on public.billing_readiness_subscriptions for select using (
  workspace_id in (select id from public.tenants where user_id = (select auth.uid()))
  or public.is_internal_tenant_reader_for_tenant(workspace_id)
);
create policy billing_readiness_checkout_sessions_select on public.billing_readiness_checkout_sessions for select using (
  workspace_id in (select id from public.tenants where user_id = (select auth.uid()))
  or public.is_internal_tenant_reader_for_tenant(workspace_id)
);
create policy billing_readiness_events_select on public.billing_readiness_events for select using (
  workspace_id is null
  or workspace_id in (select id from public.tenants where user_id = (select auth.uid()))
  or public.is_internal_tenant_reader_for_tenant(workspace_id)
);
create policy billing_readiness_trial_state_select on public.billing_readiness_trial_state for select using (
  workspace_id in (select id from public.tenants where user_id = (select auth.uid()))
  or public.is_internal_tenant_reader_for_tenant(workspace_id)
);

-- ---------------------------------------------------------------------------
-- Manager notifications (internal workspace only)
-- ---------------------------------------------------------------------------

drop policy if exists manager_notifications_tenant_member on public.manager_notifications;
create policy manager_notifications_internal on public.manager_notifications for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);
