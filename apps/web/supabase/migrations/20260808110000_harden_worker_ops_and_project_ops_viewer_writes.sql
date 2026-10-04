-- CRITICAL: close PostgREST write holes where any internal tenant reader
-- (including role=viewer) could mutate pilot field-ops and project-ops tables.
--
-- Concrete trigger: authenticated viewer JWT calls
--   DELETE /rest/v1/worker_reports?tenant_id=eq.<tid>
--   or PATCH status=approved / DELETE worker_tasks / PATCH handover status.
-- App APIs already deny viewers (canCreateReport / canManageTasks /
-- canManageProjects); this migration closes the direct REST bypass.
--
-- Helper create-or-replace matches PR #212 so either migration order is safe.

-- ---------------------------------------------------------------------------
-- Helpers (idempotent with 20260807120000_*)
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
-- worker_reports / worker_report_media: exclude viewers
-- ---------------------------------------------------------------------------

drop policy if exists worker_reports_write_internal_insert on public.worker_reports;
drop policy if exists worker_reports_write_internal_update on public.worker_reports;
drop policy if exists worker_reports_write_internal_delete on public.worker_reports;

create policy worker_reports_write_internal_insert on public.worker_reports
  for insert
  to authenticated
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

create policy worker_reports_write_internal_update on public.worker_reports
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

create policy worker_reports_write_internal_delete on public.worker_reports
  for delete
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists worker_report_media_write_internal_insert on public.worker_report_media;
drop policy if exists worker_report_media_write_internal_update on public.worker_report_media;
drop policy if exists worker_report_media_write_internal_delete on public.worker_report_media;

create policy worker_report_media_write_internal_insert on public.worker_report_media
  for insert
  to authenticated
  with check (
    report_id in (
      select wr.id
      from public.worker_reports wr
      where public.is_internal_tenant_writer_for_tenant(wr.tenant_id)
    )
  );

create policy worker_report_media_write_internal_update on public.worker_report_media
  for update
  to authenticated
  using (
    report_id in (
      select wr.id
      from public.worker_reports wr
      where public.is_internal_tenant_writer_for_tenant(wr.tenant_id)
    )
  )
  with check (
    report_id in (
      select wr.id
      from public.worker_reports wr
      where public.is_internal_tenant_writer_for_tenant(wr.tenant_id)
    )
  );

create policy worker_report_media_write_internal_delete on public.worker_report_media
  for delete
  to authenticated
  using (
    report_id in (
      select wr.id
      from public.worker_reports wr
      where public.is_internal_tenant_writer_for_tenant(wr.tenant_id)
    )
  );

-- ---------------------------------------------------------------------------
-- worker_tasks / worker_day: exclude viewers; require tenant match when project set
-- ---------------------------------------------------------------------------

drop policy if exists worker_tasks_write_internal_insert on public.worker_tasks;
drop policy if exists worker_tasks_write_internal_update on public.worker_tasks;
drop policy if exists worker_tasks_write_internal_delete on public.worker_tasks;

create policy worker_tasks_write_internal_insert on public.worker_tasks
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and (
      project_id is null
      or public.project_belongs_to_tenant(project_id, tenant_id)
    )
  );

create policy worker_tasks_write_internal_update on public.worker_tasks
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and (
      project_id is null
      or public.project_belongs_to_tenant(project_id, tenant_id)
    )
  );

create policy worker_tasks_write_internal_delete on public.worker_tasks
  for delete
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists worker_day_write_internal_insert on public.worker_day;
drop policy if exists worker_day_write_internal_update on public.worker_day;
drop policy if exists worker_day_write_internal_delete on public.worker_day;

create policy worker_day_write_internal_insert on public.worker_day
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and (
      project_id is null
      or public.project_belongs_to_tenant(project_id, tenant_id)
    )
  );

create policy worker_day_write_internal_update on public.worker_day
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and (
      project_id is null
      or public.project_belongs_to_tenant(project_id, tenant_id)
    )
  );

create policy worker_day_write_internal_delete on public.worker_day
  for delete
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id));

-- ---------------------------------------------------------------------------
-- project_issues / project_risks / project_handover(+events): exclude viewers
-- ---------------------------------------------------------------------------

drop policy if exists project_issues_write_internal_insert on public.project_issues;
drop policy if exists project_issues_write_internal_update on public.project_issues;
drop policy if exists project_issues_write_internal_delete on public.project_issues;

create policy project_issues_write_internal_insert on public.project_issues
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_issues_write_internal_update on public.project_issues
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_issues_write_internal_delete on public.project_issues
  for delete
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists project_risks_write_internal_insert on public.project_risks;
drop policy if exists project_risks_write_internal_update on public.project_risks;
drop policy if exists project_risks_write_internal_delete on public.project_risks;

create policy project_risks_write_internal_insert on public.project_risks
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_risks_write_internal_update on public.project_risks
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_risks_write_internal_delete on public.project_risks
  for delete
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists project_handover_write_internal on public.project_handover;
drop policy if exists project_handover_write_internal_insert on public.project_handover;
drop policy if exists project_handover_write_internal_update on public.project_handover;
drop policy if exists project_handover_write_internal_delete on public.project_handover;

create policy project_handover_write_internal_insert on public.project_handover
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_handover_write_internal_update on public.project_handover
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_handover_write_internal_delete on public.project_handover
  for delete
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists project_handover_events_insert_internal on public.project_handover_events;

create policy project_handover_events_insert_internal on public.project_handover_events
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );
