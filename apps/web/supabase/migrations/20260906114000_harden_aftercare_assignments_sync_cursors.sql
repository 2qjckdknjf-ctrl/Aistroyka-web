-- RELEASE HARDENING WAVE 4
-- Close #218-class direct PostgREST bypasses while preserving legitimate portal
-- aftercare creation and own-device sync cursor operations.
--
-- Dependencies from lower security waves:
--   is_internal_tenant_writer_for_tenant(uuid)
--   can_manage_project_membership(uuid, uuid)
--   project_belongs_to_tenant(uuid, uuid)

-- ---------------------------------------------------------------------------
-- Aftercare service requests: internal mutations require project manage cohort.
-- Existing project_service_requests_insert_portal is intentionally preserved.
-- ---------------------------------------------------------------------------

drop policy if exists project_service_requests_write_internal on public.project_service_requests;
drop policy if exists project_service_requests_write_internal_insert on public.project_service_requests;
drop policy if exists project_service_requests_write_internal_update on public.project_service_requests;
drop policy if exists project_service_requests_write_internal_delete on public.project_service_requests;

create policy project_service_requests_write_internal_insert on public.project_service_requests
  for insert
  to authenticated
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_service_requests_write_internal_update on public.project_service_requests
  for update
  to authenticated
  using (public.can_manage_project_membership(tenant_id, project_id))
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_service_requests_write_internal_delete on public.project_service_requests
  for delete
  to authenticated
  using (public.can_manage_project_membership(tenant_id, project_id));

-- Manager event writes are project-manage scoped.
drop policy if exists project_service_request_events_insert_internal on public.project_service_request_events;
create policy project_service_request_events_insert_internal on public.project_service_request_events
  for insert
  to authenticated
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

-- Preserve the initial audit event emitted by createServiceRequestStakeholder.
-- This does NOT permit arbitrary transitions: only an initial `reported` event
-- for a request created by the current stakeholder on the same tenant/project.
drop policy if exists project_service_request_events_insert_portal_initial on public.project_service_request_events;
create policy project_service_request_events_insert_portal_initial on public.project_service_request_events
  for insert
  to authenticated
  with check (
    public.is_portal_stakeholder_for_project(project_id)
    and actor_user_id = (select auth.uid())
    and from_status is null
    and to_status = 'reported'
    and exists (
      select 1
      from public.project_service_requests sr
      where sr.id = service_request_id
        and sr.tenant_id = project_service_request_events.tenant_id
        and sr.project_id = project_service_request_events.project_id
        and sr.created_by = (select auth.uid())
        and sr.status = 'reported'
    )
  );

-- ---------------------------------------------------------------------------
-- Task assignments: readers may resolve assignments, but only tenant writers
-- may mutate them; task_id must belong to the same tenant.
-- ---------------------------------------------------------------------------

drop policy if exists task_assignments_internal on public.task_assignments;
drop policy if exists task_assignments_select_internal on public.task_assignments;
drop policy if exists task_assignments_write_internal_insert on public.task_assignments;
drop policy if exists task_assignments_write_internal_update on public.task_assignments;
drop policy if exists task_assignments_write_internal_delete on public.task_assignments;

create policy task_assignments_select_internal on public.task_assignments
  for select
  to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy task_assignments_write_internal_insert on public.task_assignments
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and exists (
      select 1 from public.worker_tasks wt
      where wt.id = task_id and wt.tenant_id = task_assignments.tenant_id
    )
  );

create policy task_assignments_write_internal_update on public.task_assignments
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and exists (
      select 1 from public.worker_tasks wt
      where wt.id = task_id and wt.tenant_id = task_assignments.tenant_id
    )
  );

create policy task_assignments_write_internal_delete on public.task_assignments
  for delete
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id));

-- ---------------------------------------------------------------------------
-- Sync cursors: each authenticated user may only see/mutate their own rows.
-- Sync repository already keys all reads/upserts by tenantId + userId + deviceId.
-- ---------------------------------------------------------------------------

drop policy if exists sync_cursors_internal on public.sync_cursors;
drop policy if exists sync_cursors_select_own on public.sync_cursors;
drop policy if exists sync_cursors_write_own_insert on public.sync_cursors;
drop policy if exists sync_cursors_write_own_update on public.sync_cursors;
drop policy if exists sync_cursors_write_own_delete on public.sync_cursors;

create policy sync_cursors_select_own on public.sync_cursors
  for select
  to authenticated
  using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and user_id = (select auth.uid())
  );

create policy sync_cursors_write_own_insert on public.sync_cursors
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and user_id = (select auth.uid())
  );

create policy sync_cursors_write_own_update on public.sync_cursors
  for update
  to authenticated
  using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and user_id = (select auth.uid())
  )
  with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and user_id = (select auth.uid())
  );

create policy sync_cursors_write_own_delete on public.sync_cursors
  for delete
  to authenticated
  using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and user_id = (select auth.uid())
  );
