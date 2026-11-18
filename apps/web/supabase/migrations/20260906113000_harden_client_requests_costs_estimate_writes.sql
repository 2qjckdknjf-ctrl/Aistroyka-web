-- RELEASE HARDENING WAVE 3
-- Close direct-PostgREST write bypasses for customer decisions/discussions and
-- internal cost/estimate-result rows.
--
-- Dependencies are provided by Security Wave 1:
--   public.is_internal_tenant_writer_for_tenant(uuid)
--   public.can_manage_project_membership(uuid, uuid)
--   public.project_belongs_to_tenant(uuid, uuid)
--
-- Authorized stakeholder decision writes are routed through server/service-role
-- application paths before these policies are tightened.

-- ---------------------------------------------------------------------------
-- project_client_requests (+ events): project manage cohort only.
-- ---------------------------------------------------------------------------

drop policy if exists project_client_requests_write_internal_insert on public.project_client_requests;
drop policy if exists project_client_requests_write_internal_update on public.project_client_requests;
drop policy if exists project_client_requests_write_internal_delete on public.project_client_requests;

create policy project_client_requests_write_internal_insert on public.project_client_requests
  for insert
  to authenticated
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_client_requests_write_internal_update on public.project_client_requests
  for update
  to authenticated
  using (public.can_manage_project_membership(tenant_id, project_id))
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_client_requests_write_internal_delete on public.project_client_requests
  for delete
  to authenticated
  using (public.can_manage_project_membership(tenant_id, project_id));

drop policy if exists project_client_request_events_write_internal_insert on public.project_client_request_events;
drop policy if exists project_client_request_events_write_internal_update on public.project_client_request_events;
drop policy if exists project_client_request_events_write_internal_delete on public.project_client_request_events;

create policy project_client_request_events_write_internal_insert on public.project_client_request_events
  for insert
  to authenticated
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_client_request_events_write_internal_update on public.project_client_request_events
  for update
  to authenticated
  using (public.can_manage_project_membership(tenant_id, project_id))
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_client_request_events_write_internal_delete on public.project_client_request_events
  for delete
  to authenticated
  using (public.can_manage_project_membership(tenant_id, project_id));

-- ---------------------------------------------------------------------------
-- project_stakeholder_discussions: row mutation is manager/owner scoped.
-- Portal status transitions remain server-side after stakeholder policy checks.
-- ---------------------------------------------------------------------------

drop policy if exists stakeholder_discussions_write_internal_insert on public.project_stakeholder_discussions;
drop policy if exists stakeholder_discussions_write_internal_update on public.project_stakeholder_discussions;
drop policy if exists stakeholder_discussions_write_internal_delete on public.project_stakeholder_discussions;

create policy stakeholder_discussions_write_internal_insert on public.project_stakeholder_discussions
  for insert
  to authenticated
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy stakeholder_discussions_write_internal_update on public.project_stakeholder_discussions
  for update
  to authenticated
  using (public.can_manage_project_membership(tenant_id, project_id))
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy stakeholder_discussions_write_internal_delete on public.project_stakeholder_discussions
  for delete
  to authenticated
  using (public.can_manage_project_membership(tenant_id, project_id));

-- ---------------------------------------------------------------------------
-- project_cost_items: keep tenant member writer semantics, exclude viewer and
-- require project/tenant consistency on inserts/updates.
-- ---------------------------------------------------------------------------

drop policy if exists project_cost_items_internal_insert on public.project_cost_items;
drop policy if exists project_cost_items_internal_update on public.project_cost_items;
drop policy if exists project_cost_items_internal_delete on public.project_cost_items;

create policy project_cost_items_internal_insert on public.project_cost_items
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_cost_items_internal_update on public.project_cost_items
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_cost_items_internal_delete on public.project_cost_items
  for delete
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id));

-- ---------------------------------------------------------------------------
-- project_estimate_results: same non-viewer writer cohort + project consistency.
-- ---------------------------------------------------------------------------

drop policy if exists project_estimate_results_write_internal_insert on public.project_estimate_results;
drop policy if exists project_estimate_results_write_internal_update on public.project_estimate_results;
drop policy if exists project_estimate_results_write_internal_delete on public.project_estimate_results;

create policy project_estimate_results_write_internal_insert on public.project_estimate_results
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_estimate_results_write_internal_update on public.project_estimate_results
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_estimate_results_write_internal_delete on public.project_estimate_results
  for delete
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id));
