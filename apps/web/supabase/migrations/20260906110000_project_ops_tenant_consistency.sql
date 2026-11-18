-- RELEASE HARDENING WAVE 1
-- Refine generic writer policies for project-bearing operational tables.
-- Prevent a writable tenant_id from being paired with a project_id owned by another tenant.
-- Depends on project_belongs_to_tenant(...) from 20260906091000.

-- worker_tasks / worker_day: project_id may be nullable.

drop policy if exists worker_tasks_write_internal_insert on public.worker_tasks;
drop policy if exists worker_tasks_write_internal_update on public.worker_tasks;
create policy worker_tasks_write_internal_insert on public.worker_tasks
  for insert to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and (
      project_id is null
      or public.project_belongs_to_tenant(project_id, tenant_id)
    )
  );
create policy worker_tasks_write_internal_update on public.worker_tasks
  for update to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and (
      project_id is null
      or public.project_belongs_to_tenant(project_id, tenant_id)
    )
  );

drop policy if exists worker_day_write_internal_insert on public.worker_day;
drop policy if exists worker_day_write_internal_update on public.worker_day;
create policy worker_day_write_internal_insert on public.worker_day
  for insert to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and (
      project_id is null
      or public.project_belongs_to_tenant(project_id, tenant_id)
    )
  );
create policy worker_day_write_internal_update on public.worker_day
  for update to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and (
      project_id is null
      or public.project_belongs_to_tenant(project_id, tenant_id)
    )
  );

-- Project ops: project_id is required and must belong to tenant_id.

drop policy if exists project_issues_write_internal_insert on public.project_issues;
drop policy if exists project_issues_write_internal_update on public.project_issues;
create policy project_issues_write_internal_insert on public.project_issues
  for insert to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );
create policy project_issues_write_internal_update on public.project_issues
  for update to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

drop policy if exists project_risks_write_internal_insert on public.project_risks;
drop policy if exists project_risks_write_internal_update on public.project_risks;
create policy project_risks_write_internal_insert on public.project_risks
  for insert to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );
create policy project_risks_write_internal_update on public.project_risks
  for update to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

drop policy if exists project_handover_write_internal on public.project_handover;
drop policy if exists project_handover_write_internal_insert on public.project_handover;
drop policy if exists project_handover_write_internal_update on public.project_handover;
drop policy if exists project_handover_write_internal_delete on public.project_handover;
create policy project_handover_write_internal_insert on public.project_handover
  for insert to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );
create policy project_handover_write_internal_update on public.project_handover
  for update to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );
create policy project_handover_write_internal_delete on public.project_handover
  for delete to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists project_handover_events_insert_internal on public.project_handover_events;
create policy project_handover_events_insert_internal on public.project_handover_events
  for insert to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );
