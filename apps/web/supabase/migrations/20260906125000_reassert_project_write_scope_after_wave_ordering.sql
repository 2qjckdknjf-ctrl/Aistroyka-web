-- RELEASE HARDENING SECURITY WAVE 10
-- Reassert the intended final project-write policies after migration ordering.
--
-- 20260906092000 correctly tightened projects DELETE to tenant owner/admin and
-- added tenant/project consistency to project_documents/project_milestones.
-- 20260906104000 later recreated those same policy names with broader generic
-- writer checks, weakening the final applied state. This migration is the final
-- ordering guard and intentionally restores the stronger 092000 semantics.
--
-- Depends on helpers created earlier in the same ordered migration set:
--   public.is_internal_tenant_writer_for_tenant(uuid)  -- 20260906092000
--   public.is_tenant_owner_or_admin(uuid)              -- 20260906092000
--   public.project_belongs_to_tenant(uuid, uuid)       -- 20260906091000/092000

-- ---------------------------------------------------------------------------
-- projects
-- Writer cohort may create/update. Delete is tenant owner/admin only.
-- ---------------------------------------------------------------------------

drop policy if exists projects_write_internal_insert on public.projects;
drop policy if exists projects_write_internal_update on public.projects;
drop policy if exists projects_write_internal_delete on public.projects;

create policy projects_write_internal_insert
  on public.projects
  for insert
  to authenticated
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

create policy projects_write_internal_update
  on public.projects
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

create policy projects_write_internal_delete
  on public.projects
  for delete
  to authenticated
  using (public.is_tenant_owner_or_admin(tenant_id));

-- ---------------------------------------------------------------------------
-- project_documents
-- Writer cohort only; inserts/updates must remain inside the row tenant.
-- ---------------------------------------------------------------------------

drop policy if exists project_documents_write_internal_insert on public.project_documents;
drop policy if exists project_documents_write_internal_update on public.project_documents;
drop policy if exists project_documents_write_internal_delete on public.project_documents;

create policy project_documents_write_internal_insert
  on public.project_documents
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_documents_write_internal_update
  on public.project_documents
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_documents_write_internal_delete
  on public.project_documents
  for delete
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id));

-- ---------------------------------------------------------------------------
-- project_milestones
-- Writer cohort only; inserts/updates must remain inside the row tenant.
-- ---------------------------------------------------------------------------

drop policy if exists project_milestones_write_internal_insert on public.project_milestones;
drop policy if exists project_milestones_write_internal_update on public.project_milestones;
drop policy if exists project_milestones_write_internal_delete on public.project_milestones;

create policy project_milestones_write_internal_insert
  on public.project_milestones
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_milestones_write_internal_update
  on public.project_milestones
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_milestones_write_internal_delete
  on public.project_milestones
  for delete
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id));
