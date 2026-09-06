-- RELEASE HARDENING SECURITY WAVE 11
-- Final aftercare portal/read scope after the 113500 bootstrap and 114000 write hardening.
--
-- The historical portal INSERT policy proved stakeholder ownership of project_id
-- but did not prove tenant_id belonged to that project. It also allowed direct
-- PostgREST callers to populate fields that the supported stakeholder service
-- always controls. Reassert the final portal/read policy state here.

-- ---------------------------------------------------------------------------
-- Read paths: require project/tenant consistency and event/request consistency.
-- ---------------------------------------------------------------------------

drop policy if exists project_service_requests_select on public.project_service_requests;
create policy project_service_requests_select
  on public.project_service_requests
  for select
  to authenticated
  using (
    public.project_belongs_to_tenant(project_id, tenant_id)
    and (
      public.is_internal_tenant_reader_for_tenant(tenant_id)
      or public.is_portal_stakeholder_for_project(project_id)
    )
  );

drop policy if exists project_service_request_events_select on public.project_service_request_events;
create policy project_service_request_events_select
  on public.project_service_request_events
  for select
  to authenticated
  using (
    public.project_belongs_to_tenant(project_id, tenant_id)
    and exists (
      select 1
      from public.project_service_requests sr
      where sr.id = service_request_id
        and sr.tenant_id = project_service_request_events.tenant_id
        and sr.project_id = project_service_request_events.project_id
    )
    and (
      public.is_internal_tenant_reader_for_tenant(tenant_id)
      or public.is_portal_stakeholder_for_project(project_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Stakeholder create: bind row tenant/project and server-controlled fields.
-- Supported createServiceRequestStakeholder always sets exactly this shape.
-- ---------------------------------------------------------------------------

drop policy if exists project_service_requests_insert_portal on public.project_service_requests;
create policy project_service_requests_insert_portal
  on public.project_service_requests
  for insert
  to authenticated
  with check (
    public.project_belongs_to_tenant(project_id, tenant_id)
    and public.is_portal_stakeholder_for_project(project_id)
    and created_by = (select auth.uid())
    and length(btrim(title)) > 0
    and status = 'reported'
    and coverage_type = 'warranty_review_needed'
    and assigned_to is null
    and due_date is null
    and resolution_note is null
    and resolved_at is null
    and resolved_by is null
    and linked_handover_id is not null
    and exists (
      select 1
      from public.project_handover h
      where h.id = linked_handover_id
        and h.tenant_id = project_service_requests.tenant_id
        and h.project_id = project_service_requests.project_id
        and h.status in ('handed_over', 'completed')
    )
    and linked_defect_id is null
    and linked_discussion_id is null
  );
