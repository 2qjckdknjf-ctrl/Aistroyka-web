-- tenant_members.role = 'member' maps to the field-worker role. Task chat must
-- therefore grant tenant-wide access only to owner/admin; members and viewers
-- are restricted to tasks assigned to auth.uid(). This cannot rely on the
-- caller-provided x-client header because RLS also protects direct Data API and
-- Realtime access.

drop policy if exists task_messages_select on public.task_messages;
drop policy if exists task_messages_insert on public.task_messages;

create policy task_messages_select on public.task_messages
  for select
  to authenticated
  using (
    deleted_at is null
    and (
      exists (
        select 1
        from public.tenant_members tm
        where tm.tenant_id = task_messages.tenant_id
          and tm.user_id = (select auth.uid())
          and tm.role in ('owner', 'admin')
      )
      or exists (
        select 1
        from public.tenants t
        where t.id = task_messages.tenant_id
          and t.user_id = (select auth.uid())
      )
      or exists (
        select 1
        from public.worker_tasks wt
        where wt.id = task_messages.task_id
          and wt.tenant_id = task_messages.tenant_id
          and wt.project_id = task_messages.project_id
          and (
            wt.assigned_to = (select auth.uid())
            or exists (
              select 1
              from public.task_assignments ta
              where ta.task_id = wt.id
                and ta.tenant_id = wt.tenant_id
                and ta.user_id = (select auth.uid())
            )
          )
      )
    )
  );

create policy task_messages_insert on public.task_messages
  for insert
  to authenticated
  with check (
    sender_user_id = (select auth.uid())
    and exists (
      select 1
      from public.worker_tasks wt
      where wt.id = task_messages.task_id
        and wt.tenant_id = task_messages.tenant_id
        and wt.project_id = task_messages.project_id
        and (
          exists (
            select 1
            from public.tenant_members tm
            where tm.tenant_id = task_messages.tenant_id
              and tm.user_id = (select auth.uid())
              and tm.role in ('owner', 'admin')
          )
          or exists (
            select 1
            from public.tenants t
            where t.id = task_messages.tenant_id
              and t.user_id = (select auth.uid())
          )
          or wt.assigned_to = (select auth.uid())
          or exists (
            select 1
            from public.task_assignments ta
            where ta.task_id = wt.id
              and ta.tenant_id = wt.tenant_id
              and ta.user_id = (select auth.uid())
          )
        )
    )
  );
