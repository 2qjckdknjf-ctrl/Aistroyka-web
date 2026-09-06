-- CRITICAL: close PostgREST write holes on aftercare, task assignment, and sync cursors.
--
-- Concrete triggers (authenticated JWT, PostgREST):
--   PATCH /rest/v1/project_service_requests?id=eq.<id>
--     { "status":"closed", "resolution_note":"forged" }
--   DELETE /rest/v1/task_assignments?tenant_id=eq.<tid>&task_id=eq.<task>
--   DELETE /rest/v1/sync_cursors?tenant_id=eq.<tid>&user_id=eq.<victim>
--
-- App APIs already gate service-request writes (canManageAftercareRequests → manage cohort)
-- and task assignment writes (canManageTasks → owner/admin/member). Sync ack only upserts
-- the caller's own (tenant,user,device) row. RLS previously allowed any internal reader
-- (including viewer / bare member) to mutate these tables — and sync_cursors had no
-- user_id = auth.uid() bound, so one member could wipe another device's cursor.
--
-- Helper create-or-replace matches open PRs #210/#212/#213/#216 so migration order is safe.
-- Portal stakeholder insert on project_service_requests is preserved.

-- ---------------------------------------------------------------------------
-- Helpers (idempotent with 20260806120000 / 20260807120000 / 20260808110000 / 20260809110000)
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
  'True for tenant owner/admin/member (excludes viewer). Used for non-commercial workspace writes.';

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

comment on function public.project_belongs_to_tenant(uuid, uuid) is
  'True when projects.id belongs to the given tenant_id (blocks cross-tenant FK writes).';

-- ---------------------------------------------------------------------------
-- project_service_requests: manage cohort only (preserve portal insert)
-- Matches canManageAftercareRequests → canManageClientRequests.
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

drop policy if exists project_service_request_events_insert_internal on public.project_service_request_events;

create policy project_service_request_events_insert_internal on public.project_service_request_events
  for insert
  to authenticated
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

-- ---------------------------------------------------------------------------
-- task_assignments: exclude viewers (matches canManageTasks / canManageProjects)
-- Keep SELECT for internal readers so workers/managers can resolve assignments.
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
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

create policy task_assignments_write_internal_update on public.task_assignments
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

create policy task_assignments_write_internal_delete on public.task_assignments
  for delete
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id));

-- ---------------------------------------------------------------------------
-- sync_cursors: bind rows to auth.uid() (caller may only touch own device cursors)
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
