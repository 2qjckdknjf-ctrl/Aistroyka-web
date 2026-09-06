-- Release hardening 2026-09-06.
-- Separate read and write cohorts and harden project-scoped commercial authorization.
-- Current main's is_internal_tenant_reader_for_tenant includes viewer; it must not be
-- reused for generic INSERT/UPDATE/DELETE authorization.

-- ---------------------------------------------------------------------------
-- Tenant writer helper: preserve current member write semantics, exclude viewer.
-- ---------------------------------------------------------------------------

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
  'Tenant write cohort: tenant owner or tenant member role owner/admin/member; explicitly excludes viewer/stakeholder.';

create or replace function public.project_belongs_to_tenant(p_project_id uuid, p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.tenant_id = p_tenant_id
  );
$$;

revoke all on function public.project_belongs_to_tenant(uuid, uuid) from public;
grant execute on function public.project_belongs_to_tenant(uuid, uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- project_members: role/identity mutation cannot be used for self-promotion.
-- ---------------------------------------------------------------------------

create or replace function public.enforce_project_members_privilege_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_tenant_admin boolean;
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if new.user_id is distinct from old.user_id
     or new.tenant_id is distinct from old.tenant_id
     or new.project_id is distinct from old.project_id then
    raise exception 'project_members identity columns are immutable for authenticated clients';
  end if;

  if new.role is not distinct from old.role then
    return new;
  end if;

  is_tenant_admin := exists (
    select 1 from public.tenants t
    where t.id = new.tenant_id and t.user_id = (select auth.uid())
  ) or exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = new.tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner', 'admin')
  );

  if not is_tenant_admin then
    raise exception 'project_members.role change requires tenant owner/admin';
  end if;

  return new;
end;
$$;

drop trigger if exists project_members_enforce_privilege_change on public.project_members;
create trigger project_members_enforce_privilege_change
  before update on public.project_members
  for each row
  execute function public.enforce_project_members_privilege_change();

revoke all on function public.enforce_project_members_privilege_change() from public;

-- Keep manager project-membership administration, but owner role creation remains
-- restricted to tenant owner/admin.
drop policy if exists project_members_insert_scoped on public.project_members;
create policy project_members_insert_scoped on public.project_members
  for insert
  to authenticated
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
    and (
      role in ('worker', 'contractor', 'manager')
      or exists (
        select 1 from public.tenants t
        where t.id = tenant_id and t.user_id = (select auth.uid())
      )
      or exists (
        select 1 from public.tenant_members tm
        where tm.tenant_id = project_members.tenant_id
          and tm.user_id = (select auth.uid())
          and tm.role in ('owner', 'admin')
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Generic tenant-scoped writes: replace reader helper with writer helper.
-- These keep existing owner/admin/member semantics while excluding viewer.
-- ---------------------------------------------------------------------------

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

drop policy if exists projects_write_internal_insert on public.projects;
drop policy if exists projects_write_internal_update on public.projects;
drop policy if exists projects_write_internal_delete on public.projects;
create policy projects_write_internal_insert on public.projects for insert to authenticated with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy projects_write_internal_update on public.projects for update to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id)) with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
create policy projects_write_internal_delete on public.projects for delete to authenticated using (public.is_internal_tenant_writer_for_tenant(tenant_id));

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

-- ---------------------------------------------------------------------------
-- Sensitive commercial surfaces: stronger project-manager/owner authorization.
-- ---------------------------------------------------------------------------

drop policy if exists proof_pack_shares_internal on public.proof_pack_shares;
drop policy if exists proof_pack_shares_select_manage on public.proof_pack_shares;
drop policy if exists proof_pack_shares_insert_manage on public.proof_pack_shares;
drop policy if exists proof_pack_shares_update_manage on public.proof_pack_shares;
drop policy if exists proof_pack_shares_delete_manage on public.proof_pack_shares;
create policy proof_pack_shares_select_manage on public.proof_pack_shares for select to authenticated using (public.can_manage_project_membership(tenant_id, project_id));
create policy proof_pack_shares_insert_manage on public.proof_pack_shares for insert to authenticated with check (public.can_manage_project_membership(tenant_id, project_id) and public.project_belongs_to_tenant(project_id, tenant_id));
create policy proof_pack_shares_update_manage on public.proof_pack_shares for update to authenticated using (public.can_manage_project_membership(tenant_id, project_id)) with check (public.can_manage_project_membership(tenant_id, project_id) and public.project_belongs_to_tenant(project_id, tenant_id));
create policy proof_pack_shares_delete_manage on public.proof_pack_shares for delete to authenticated using (public.can_manage_project_membership(tenant_id, project_id));

drop policy if exists change_orders_write_internal_insert on public.project_change_orders;
drop policy if exists change_orders_write_internal_update on public.project_change_orders;
drop policy if exists change_orders_write_internal_delete on public.project_change_orders;
create policy change_orders_write_internal_insert on public.project_change_orders for insert to authenticated with check (public.can_manage_project_membership(tenant_id, project_id) and public.project_belongs_to_tenant(project_id, tenant_id));
create policy change_orders_write_internal_update on public.project_change_orders for update to authenticated using (public.can_manage_project_membership(tenant_id, project_id)) with check (public.can_manage_project_membership(tenant_id, project_id) and public.project_belongs_to_tenant(project_id, tenant_id));
create policy change_orders_write_internal_delete on public.project_change_orders for delete to authenticated using (public.can_manage_project_membership(tenant_id, project_id));

drop policy if exists change_order_events_insert_internal on public.project_change_order_events;
create policy change_order_events_insert_internal on public.project_change_order_events for insert to authenticated with check (public.can_manage_project_membership(tenant_id, project_id) and public.project_belongs_to_tenant(project_id, tenant_id));

drop policy if exists project_commercial_items_write_internal on public.project_commercial_items;
drop policy if exists project_commercial_items_internal_insert on public.project_commercial_items;
drop policy if exists project_commercial_items_internal_update on public.project_commercial_items;
drop policy if exists project_commercial_items_internal_delete on public.project_commercial_items;
create policy project_commercial_items_internal_insert on public.project_commercial_items for insert to authenticated with check (public.can_manage_project_membership(tenant_id, project_id) and public.project_belongs_to_tenant(project_id, tenant_id));
create policy project_commercial_items_internal_update on public.project_commercial_items for update to authenticated using (public.can_manage_project_membership(tenant_id, project_id)) with check (public.can_manage_project_membership(tenant_id, project_id) and public.project_belongs_to_tenant(project_id, tenant_id));
create policy project_commercial_items_internal_delete on public.project_commercial_items for delete to authenticated using (public.can_manage_project_membership(tenant_id, project_id));

drop policy if exists project_commercial_item_events_insert_internal on public.project_commercial_item_events;
create policy project_commercial_item_events_insert_internal on public.project_commercial_item_events for insert to authenticated with check (public.can_manage_project_membership(tenant_id, project_id) and public.project_belongs_to_tenant(project_id, tenant_id));

-- Defects retain customer portal open-defect creation, but internal mutation requires manager cohort.
drop policy if exists project_defects_insert on public.project_defects;
create policy project_defects_insert on public.project_defects
  for insert to authenticated
  with check (
    public.project_belongs_to_tenant(project_id, tenant_id)
    and (
      public.can_manage_project_membership(tenant_id, project_id)
      or (
        public.is_portal_stakeholder_for_project(project_id)
        and created_by = (select auth.uid())
        and status = 'open'::text
        and assigned_to is null
      )
    )
  );

drop policy if exists project_defects_write_internal_update on public.project_defects;
drop policy if exists project_defects_write_internal_delete on public.project_defects;
create policy project_defects_write_internal_update on public.project_defects for update to authenticated using (public.can_manage_project_membership(tenant_id, project_id)) with check (public.can_manage_project_membership(tenant_id, project_id) and public.project_belongs_to_tenant(project_id, tenant_id));
create policy project_defects_write_internal_delete on public.project_defects for delete to authenticated using (public.can_manage_project_membership(tenant_id, project_id));
