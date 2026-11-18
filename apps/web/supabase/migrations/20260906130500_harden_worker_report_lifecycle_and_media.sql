-- RELEASE HARDENING SECURITY WAVE 13
-- Worker report lifecycle / evidence integrity.
--
-- Current generic tenant-writer policies allow any member to directly forge
-- report review state, rewrite another worker's report, delete reports/media,
-- and attach cross-tenant evidence. Application APIs are substantially stricter.

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.worker_report_refs_same_tenant(
  p_tenant_id uuid,
  p_task_id uuid,
  p_day_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (
      p_task_id is null
      or exists (
        select 1 from public.worker_tasks wt
        where wt.id = p_task_id and wt.tenant_id = p_tenant_id
      )
    )
    and (
      p_day_id is null
      or exists (
        select 1 from public.worker_day wd
        where wd.id = p_day_id and wd.tenant_id = p_tenant_id
      )
    )
    and not exists (
      select 1
      from public.worker_tasks wt
      join public.worker_day wd
        on wd.id = p_day_id
       and wd.tenant_id = p_tenant_id
      where wt.id = p_task_id
        and wt.tenant_id = p_tenant_id
        and wt.project_id is not null
        and wd.project_id is not null
        and wt.project_id is distinct from wd.project_id
    );
$$;

revoke all on function public.worker_report_refs_same_tenant(uuid, uuid, uuid) from public;
grant execute on function public.worker_report_refs_same_tenant(uuid, uuid, uuid)
  to authenticated, service_role;

create or replace function public.worker_report_insert_links_valid(
  p_tenant_id uuid,
  p_user_id uuid,
  p_task_id uuid,
  p_day_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.worker_report_refs_same_tenant(p_tenant_id, p_task_id, p_day_id)
    and (
      p_day_id is null
      or exists (
        select 1 from public.worker_day wd
        where wd.id = p_day_id
          and wd.tenant_id = p_tenant_id
          and wd.user_id = p_user_id
      )
    )
    and (
      p_task_id is null
      or exists (
        select 1
        from public.worker_tasks wt
        where wt.id = p_task_id
          and wt.tenant_id = p_tenant_id
          and (
            wt.assigned_to = p_user_id
            or exists (
              select 1 from public.task_assignments ta
              where ta.tenant_id = p_tenant_id
                and ta.task_id = p_task_id
                and ta.user_id = p_user_id
            )
          )
      )
    );
$$;

revoke all on function public.worker_report_insert_links_valid(uuid, uuid, uuid, uuid) from public;
grant execute on function public.worker_report_insert_links_valid(uuid, uuid, uuid, uuid)
  to authenticated, service_role;

create or replace function public.worker_report_project_id_for_scope(
  p_tenant_id uuid,
  p_task_id uuid,
  p_day_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select wt.project_id
      from public.worker_tasks wt
      where wt.id = p_task_id and wt.tenant_id = p_tenant_id
    ),
    (
      select wd.project_id
      from public.worker_day wd
      where wd.id = p_day_id and wd.tenant_id = p_tenant_id
    )
  );
$$;

revoke all on function public.worker_report_project_id_for_scope(uuid, uuid, uuid) from public;
grant execute on function public.worker_report_project_id_for_scope(uuid, uuid, uuid)
  to authenticated, service_role;

create or replace function public.can_review_worker_report(
  p_tenant_id uuid,
  p_task_id uuid,
  p_day_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.tenants t
      where t.id = p_tenant_id and t.user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.tenant_members tm
      where tm.tenant_id = p_tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
    or (
      public.worker_report_project_id_for_scope(p_tenant_id, p_task_id, p_day_id) is not null
      and public.can_manage_project_membership(
        p_tenant_id,
        public.worker_report_project_id_for_scope(p_tenant_id, p_task_id, p_day_id)
      )
    );
$$;

revoke all on function public.can_review_worker_report(uuid, uuid, uuid) from public;
grant execute on function public.can_review_worker_report(uuid, uuid, uuid)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- worker_reports RLS
-- ---------------------------------------------------------------------------

drop policy if exists worker_reports_select_portal on public.worker_reports;
create policy worker_reports_select_portal
  on public.worker_reports
  for select
  to authenticated
  using (
    public.worker_report_refs_same_tenant(tenant_id, task_id, day_id)
    and (
      public.is_internal_tenant_reader_for_tenant(tenant_id)
      or (
        task_id is not null
        and exists (
          select 1 from public.worker_tasks wt
          where wt.id = worker_reports.task_id
            and wt.tenant_id = worker_reports.tenant_id
            and wt.project_id is not null
            and public.is_portal_stakeholder_for_project(wt.project_id)
        )
      )
    )
  );

drop policy if exists worker_reports_write_internal_insert on public.worker_reports;
drop policy if exists worker_reports_write_internal_update on public.worker_reports;
drop policy if exists worker_reports_write_internal_delete on public.worker_reports;

create policy worker_reports_write_worker_insert
  on public.worker_reports
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and user_id = (select auth.uid())
    and status = 'draft'
    and submitted_at is null
    and reviewed_at is null
    and reviewed_by is null
    and manager_note is null
    and public.worker_report_insert_links_valid(tenant_id, user_id, task_id, day_id)
  );

create policy worker_reports_write_scoped_update
  on public.worker_reports
  for update
  to authenticated
  using (
    (
      user_id = (select auth.uid())
      and public.is_internal_tenant_writer_for_tenant(tenant_id)
    )
    or public.can_review_worker_report(tenant_id, task_id, day_id)
  )
  with check (
    public.worker_report_refs_same_tenant(tenant_id, task_id, day_id)
    and (
      (
        user_id = (select auth.uid())
        and public.is_internal_tenant_writer_for_tenant(tenant_id)
      )
      or public.can_review_worker_report(tenant_id, task_id, day_id)
    )
  );

-- No authenticated DELETE policy for reports: the supported product has no
-- delete-report flow. service_role retains bypass for explicit server repair.

-- ---------------------------------------------------------------------------
-- Transition/field guard. RLS answers who; this trigger answers what.
-- ---------------------------------------------------------------------------

create or replace function public.enforce_worker_report_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := (select auth.uid());
  is_worker boolean;
  is_reviewer boolean;
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if caller is null then
    raise exception 'worker report mutation requires authenticated user';
  end if;

  if new.tenant_id is distinct from old.tenant_id
     or new.user_id is distinct from old.user_id
     or new.day_id is distinct from old.day_id
     or new.created_at is distinct from old.created_at then
    raise exception 'worker report identity/day fields are immutable';
  end if;

  if not public.worker_report_refs_same_tenant(new.tenant_id, new.task_id, new.day_id) then
    raise exception 'worker report task/day must belong to report tenant';
  end if;

  is_worker := old.user_id = caller
    and public.is_internal_tenant_writer_for_tenant(old.tenant_id);
  is_reviewer := public.can_review_worker_report(old.tenant_id, old.task_id, old.day_id);

  if is_worker and old.status in ('draft', 'changes_requested') and new.status = 'submitted' then
    if new.task_id is distinct from old.task_id
       and not public.worker_report_insert_links_valid(new.tenant_id, new.user_id, new.task_id, new.day_id) then
      raise exception 'worker report task must be assigned to report owner';
    end if;

    if new.reviewed_at is distinct from old.reviewed_at
       or new.reviewed_by is distinct from old.reviewed_by
       or new.manager_note is distinct from old.manager_note then
      raise exception 'worker cannot mutate report review fields';
    end if;

    new.submitted_at := now();
    return new;
  end if;

  if is_reviewer
     and old.status = 'submitted'
     and new.status in ('approved', 'rejected', 'changes_requested') then
    if new.task_id is distinct from old.task_id
       or new.worker_note is distinct from old.worker_note
       or new.actual_volume is distinct from old.actual_volume
       or new.planned_volume is distinct from old.planned_volume
       or new.submitted_at is distinct from old.submitted_at then
      raise exception 'reviewer cannot mutate worker report content';
    end if;

    if new.status in ('rejected', 'changes_requested')
       and nullif(btrim(coalesce(new.manager_note, '')), '') is null then
      raise exception 'manager note required for reject/changes requested';
    end if;

    new.reviewed_at := now();
    new.reviewed_by := caller;
    return new;
  end if;

  raise exception 'worker report lifecycle transition not permitted';
end;
$$;

revoke all on function public.enforce_worker_report_lifecycle() from public;

drop trigger if exists worker_reports_enforce_lifecycle on public.worker_reports;
create trigger worker_reports_enforce_lifecycle
  before update on public.worker_reports
  for each row execute function public.enforce_worker_report_lifecycle();

-- ---------------------------------------------------------------------------
-- worker_report_media: append-only own-report evidence while worker may edit.
-- ---------------------------------------------------------------------------

drop policy if exists worker_report_media_select_portal on public.worker_report_media;
create policy worker_report_media_select_portal
  on public.worker_report_media
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.worker_reports wr
      where wr.id = worker_report_media.report_id
        and public.worker_report_refs_same_tenant(wr.tenant_id, wr.task_id, wr.day_id)
        and (
          public.is_internal_tenant_reader_for_tenant(wr.tenant_id)
          or (
            wr.task_id is not null
            and exists (
              select 1 from public.worker_tasks wt
              where wt.id = wr.task_id
                and wt.tenant_id = wr.tenant_id
                and wt.project_id is not null
                and public.is_portal_stakeholder_for_project(wt.project_id)
            )
          )
        )
        and (
          worker_report_media.media_id is null
          or exists (
            select 1 from public.media m
            where m.id = worker_report_media.media_id
              and m.tenant_id = wr.tenant_id
          )
        )
        and (
          worker_report_media.upload_session_id is null
          or exists (
            select 1 from public.upload_sessions us
            where us.id = worker_report_media.upload_session_id
              and us.tenant_id = wr.tenant_id
          )
        )
    )
  );

drop policy if exists worker_report_media_write_internal_insert on public.worker_report_media;
drop policy if exists worker_report_media_write_internal_update on public.worker_report_media;
drop policy if exists worker_report_media_write_internal_delete on public.worker_report_media;

create policy worker_report_media_insert_own_editable_report
  on public.worker_report_media
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.worker_reports wr
      where wr.id = worker_report_media.report_id
        and wr.user_id = (select auth.uid())
        and wr.status in ('draft', 'changes_requested')
        and public.is_internal_tenant_writer_for_tenant(wr.tenant_id)
        and (
          worker_report_media.media_id is null
          or exists (
            select 1 from public.media m
            where m.id = worker_report_media.media_id
              and m.tenant_id = wr.tenant_id
          )
        )
        and (
          worker_report_media.upload_session_id is null
          or exists (
            select 1 from public.upload_sessions us
            where us.id = worker_report_media.upload_session_id
              and us.tenant_id = wr.tenant_id
              and us.user_id = (select auth.uid())
              and us.status = 'finalized'
              and us.purpose in ('report_before', 'report_after')
          )
        )
    )
  );

-- No authenticated UPDATE/DELETE policies for evidence links.
