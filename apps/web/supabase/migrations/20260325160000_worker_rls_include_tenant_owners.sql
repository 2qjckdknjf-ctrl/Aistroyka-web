-- STAGE 4 pilot: workers who are tenant owners (tenants.user_id) may have no tenant_members row.
-- Previous worker_* / upload_sessions RLS only checked tenant_members, blocking inserts for owners.

drop policy if exists worker_reports_tenant on public.worker_reports;
create policy worker_reports_tenant on public.worker_reports for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);

drop policy if exists worker_report_media_via_report on public.worker_report_media;
create policy worker_report_media_via_report on public.worker_report_media for all using (
  report_id in (
    select id from public.worker_reports
    where
      tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
      or tenant_id in (select id from public.tenants where user_id = auth.uid())
  )
);

drop policy if exists worker_day_tenant on public.worker_day;
create policy worker_day_tenant on public.worker_day for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);

drop policy if exists upload_sessions_tenant on public.upload_sessions;
create policy upload_sessions_tenant on public.upload_sessions for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);

drop policy if exists worker_tasks_tenant on public.worker_tasks;
create policy worker_tasks_tenant on public.worker_tasks for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);
