-- CRITICAL: close PostgREST write holes where any internal tenant reader
-- (including role=viewer, and bare field-worker members on manage-gated tables)
-- could mutate customer decisions, discussion threads, internal cost rows, or
-- AI estimate results via direct Supabase REST.
--
-- Concrete triggers (authenticated JWT, PostgREST):
--   PATCH /rest/v1/project_client_requests?id=eq.<id>
--     { "status":"responded", "response_value":"approved" }
--   DELETE /rest/v1/project_cost_items?tenant_id=eq.<tid>
--   DELETE /rest/v1/project_estimate_results?project_id=eq.<pid>
--   PATCH /rest/v1/project_stakeholder_discussions?id=eq.<id>
--     { "status":"resolved" }
--
-- App APIs already gate these (canManageClientRequests / canManageProjects);
-- this migration closes the direct REST bypass.
--
-- Helper create-or-replace matches open PRs #210/#212/#213 so migration order is safe.
-- Portal decision-maker respond remains app-layer (open PR #205 uses service role
-- after authz); stakeholders are not internal writers today.

-- ---------------------------------------------------------------------------
-- Helpers (idempotent with 20260806120000 / 20260807120000 / 20260808110000)
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
-- project_client_requests (+ events): manage cohort only
-- Matches canManageClientRequests (tenant owner/admin or project manager/owner).
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
-- project_stakeholder_discussions: same manage cohort as client requests
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
-- project_cost_items: exclude viewers; require project∈tenant
-- Matches canManageProjects (owner/admin/member).
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
-- project_estimate_results: exclude viewers; require project∈tenant
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
