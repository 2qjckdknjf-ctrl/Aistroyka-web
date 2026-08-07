-- CRITICAL: close PostgREST write holes where any internal tenant reader
-- (including role=viewer) could mutate high-blast-radius tables.
--
-- 1) projects / project_documents / project_milestones writes trusted
--    is_internal_tenant_reader_for_tenant (includes viewer) → data loss.
-- 2) customer_estimates writes allowed any internal reader → forge customer
--    approval / delete commercial proposals.
-- 3) jobs / job_events FOR ALL allowed viewers/members to mark success/dead,
--    rewrite payloads, or poison the AI queue.
--
-- App APIs already gate most of these; this migration closes the direct REST bypass.

-- ---------------------------------------------------------------------------
-- Helpers
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

create or replace function public.is_tenant_owner_or_admin(p_tenant_id uuid)
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
      and tm.role in ('owner', 'admin')
  );
$$;

revoke all on function public.is_tenant_owner_or_admin(uuid) from public;
grant execute on function public.is_tenant_owner_or_admin(uuid) to authenticated, service_role;

comment on function public.is_tenant_owner_or_admin(uuid) is
  'True for tenant owner or admin (or tenants.user_id owner).';

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
-- projects: viewers cannot CUD; only owner/admin may DELETE
-- ---------------------------------------------------------------------------

drop policy if exists projects_write_internal_insert on public.projects;
drop policy if exists projects_write_internal_update on public.projects;
drop policy if exists projects_write_internal_delete on public.projects;

create policy projects_write_internal_insert on public.projects
  for insert
  to authenticated
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

create policy projects_write_internal_update on public.projects
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

create policy projects_write_internal_delete on public.projects
  for delete
  to authenticated
  using (public.is_tenant_owner_or_admin(tenant_id));

-- ---------------------------------------------------------------------------
-- project_documents / project_milestones: exclude viewers; require tenant match
-- ---------------------------------------------------------------------------

drop policy if exists project_documents_write_internal_insert on public.project_documents;
drop policy if exists project_documents_write_internal_update on public.project_documents;
drop policy if exists project_documents_write_internal_delete on public.project_documents;

create policy project_documents_write_internal_insert on public.project_documents
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_documents_write_internal_update on public.project_documents
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_documents_write_internal_delete on public.project_documents
  for delete
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists project_milestones_write_internal_insert on public.project_milestones;
drop policy if exists project_milestones_write_internal_update on public.project_milestones;
drop policy if exists project_milestones_write_internal_delete on public.project_milestones;

create policy project_milestones_write_internal_insert on public.project_milestones
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_milestones_write_internal_update on public.project_milestones
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_milestones_write_internal_delete on public.project_milestones
  for delete
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id));

-- ---------------------------------------------------------------------------
-- customer_estimates: manage cohort only + block forged approval via REST
-- ---------------------------------------------------------------------------

drop policy if exists customer_estimates_insert_internal on public.customer_estimates;
drop policy if exists customer_estimates_update_internal on public.customer_estimates;
drop policy if exists customer_estimates_delete_internal on public.customer_estimates;
drop policy if exists customer_estimates_internal_write on public.customer_estimates;

create policy customer_estimates_insert_internal on public.customer_estimates
  for insert
  to authenticated
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy customer_estimates_update_internal on public.customer_estimates
  for update
  to authenticated
  using (public.can_manage_project_membership(tenant_id, project_id))
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy customer_estimates_delete_internal on public.customer_estimates
  for delete
  to authenticated
  using (public.can_manage_project_membership(tenant_id, project_id));

drop policy if exists customer_estimate_items_internal_write on public.customer_estimate_items;
drop policy if exists customer_estimate_items_insert_internal on public.customer_estimate_items;
drop policy if exists customer_estimate_items_update_internal on public.customer_estimate_items;
drop policy if exists customer_estimate_items_delete_internal on public.customer_estimate_items;

create policy customer_estimate_items_insert_internal on public.customer_estimate_items
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.customer_estimates e
      where e.id = estimate_id
        and public.can_manage_project_membership(e.tenant_id, e.project_id)
        and public.project_belongs_to_tenant(e.project_id, e.tenant_id)
    )
  );

create policy customer_estimate_items_update_internal on public.customer_estimate_items
  for update
  to authenticated
  using (
    exists (
      select 1 from public.customer_estimates e
      where e.id = estimate_id
        and public.can_manage_project_membership(e.tenant_id, e.project_id)
    )
  )
  with check (
    exists (
      select 1 from public.customer_estimates e
      where e.id = estimate_id
        and public.can_manage_project_membership(e.tenant_id, e.project_id)
        and public.project_belongs_to_tenant(e.project_id, e.tenant_id)
    )
  );

create policy customer_estimate_items_delete_internal on public.customer_estimate_items
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.customer_estimates e
      where e.id = estimate_id
        and public.can_manage_project_membership(e.tenant_id, e.project_id)
    )
  );

-- Decision outcomes must go through authorized app paths (service role), not PostgREST.
create or replace function public.enforce_customer_estimate_decision_via_service()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status in ('approved', 'rejected') then
      raise exception 'customer_estimates approved/rejected requires service role';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status
     and new.status in ('approved', 'rejected') then
    raise exception 'customer_estimates approved/rejected requires service role';
  end if;

  if new.approved_by_customer_at is distinct from old.approved_by_customer_at
     or new.rejected_by_customer_at is distinct from old.rejected_by_customer_at then
    raise exception 'customer_estimates decision timestamps require service role';
  end if;

  return new;
end;
$$;

drop trigger if exists customer_estimates_enforce_decision_service on public.customer_estimates;
create trigger customer_estimates_enforce_decision_service
  before insert or update on public.customer_estimates
  for each row
  execute function public.enforce_customer_estimate_decision_via_service();

revoke all on function public.enforce_customer_estimate_decision_via_service() from public;

comment on function public.enforce_customer_estimate_decision_via_service() is
  'Blocks PostgREST forgery of customer estimate approval/rejection; service_role only.';

-- ---------------------------------------------------------------------------
-- jobs / job_events: authenticated may SELECT + INSERT enqueue;
-- UPDATE only to free dedupe_key on terminal rows (guarded by trigger);
-- DELETE and lifecycle transitions are service_role only.
-- ---------------------------------------------------------------------------

drop policy if exists jobs_internal on public.jobs;

create policy jobs_select_internal on public.jobs
  for select
  to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy jobs_insert_internal on public.jobs
  for insert
  to authenticated
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

-- Needed so user-scoped enqueue can null dedupe_key on dead/success before re-insert.
create policy jobs_update_internal on public.jobs
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

-- No authenticated DELETE policy.

create or replace function public.enforce_jobs_authenticated_update_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  -- Authenticated clients may only clear dedupe_key (idempotent re-enqueue).
  if new.status is distinct from old.status
     or new.payload is distinct from old.payload
     or new.type is distinct from old.type
     or new.tenant_id is distinct from old.tenant_id
     or new.user_id is distinct from old.user_id
     or new.attempts is distinct from old.attempts
     or new.max_attempts is distinct from old.max_attempts
     or new.run_after is distinct from old.run_after
     or new.locked_by is distinct from old.locked_by
     or new.locked_at is distinct from old.locked_at
     or new.last_error is distinct from old.last_error
     or new.last_error_type is distinct from old.last_error_type
     or new.trace_id is distinct from old.trace_id then
    raise exception 'jobs lifecycle fields are immutable for authenticated clients';
  end if;

  if new.dedupe_key is not null then
    raise exception 'authenticated jobs update may only clear dedupe_key';
  end if;

  if old.status not in ('success', 'dead') then
    raise exception 'authenticated jobs update may only free dedupe_key on terminal jobs';
  end if;

  return new;
end;
$$;

drop trigger if exists jobs_enforce_authenticated_update on public.jobs;
create trigger jobs_enforce_authenticated_update
  before update on public.jobs
  for each row
  execute function public.enforce_jobs_authenticated_update_guard();

revoke all on function public.enforce_jobs_authenticated_update_guard() from public;

comment on function public.enforce_jobs_authenticated_update_guard() is
  'Blocks PostgREST job status/payload forgery; allows clearing dedupe_key on terminal jobs only.';

drop policy if exists job_events_internal on public.job_events;
drop policy if exists job_events_via_job on public.job_events;

create policy job_events_select_internal on public.job_events
  for select
  to authenticated
  using (
    job_id in (
      select j.id from public.jobs j
      where public.is_internal_tenant_reader_for_tenant(j.tenant_id)
    )
  );

create policy job_events_insert_internal on public.job_events
  for insert
  to authenticated
  with check (
    job_id in (
      select j.id from public.jobs j
      where public.is_internal_tenant_writer_for_tenant(j.tenant_id)
    )
  );
