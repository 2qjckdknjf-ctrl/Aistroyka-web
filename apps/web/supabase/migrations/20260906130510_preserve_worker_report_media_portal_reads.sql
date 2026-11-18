-- SECURITY WAVE 13 follow-up: preserve stakeholder evidence visibility without
-- relying on the stakeholder having direct SELECT permission on upload_sessions/media.
-- The preceding 130500 policy is fail-closed; this migration replaces only the
-- report-media SELECT policy with an equivalent tenant-consistency check exposed
-- as a boolean SECURITY DEFINER helper.

create or replace function public.worker_report_media_link_same_tenant(
  p_report_id uuid,
  p_media_id uuid,
  p_upload_session_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.worker_reports wr
    where wr.id = p_report_id
      and (
        p_media_id is null
        or exists (
          select 1 from public.media m
          where m.id = p_media_id and m.tenant_id = wr.tenant_id
        )
      )
      and (
        p_upload_session_id is null
        or exists (
          select 1 from public.upload_sessions us
          where us.id = p_upload_session_id and us.tenant_id = wr.tenant_id
        )
      )
  );
$$;

revoke all on function public.worker_report_media_link_same_tenant(uuid, uuid, uuid) from public;
grant execute on function public.worker_report_media_link_same_tenant(uuid, uuid, uuid)
  to authenticated, service_role;

drop policy if exists worker_report_media_select_portal on public.worker_report_media;
create policy worker_report_media_select_portal
  on public.worker_report_media
  for select
  to authenticated
  using (
    public.worker_report_media_link_same_tenant(report_id, media_id, upload_session_id)
    and exists (
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
    )
  );
