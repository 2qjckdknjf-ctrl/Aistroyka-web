-- Tighten task_messages RLS: managers = owner/admin/member (+ tenant owner),
-- not bare is_internal_tenant_reader_for_tenant (which includes viewer).
-- Assigned workers keep access via assignment branch.

drop policy if exists task_messages_select on public.task_messages;
drop policy if exists task_messages_insert on public.task_messages;

create policy task_messages_select on public.task_messages
  for select using (
    deleted_at is null
    and (
      exists (
        select 1
        from public.tenant_members tm
        where tm.tenant_id = task_messages.tenant_id
          and tm.user_id = (select auth.uid())
          and tm.role in ('owner', 'admin', 'member')
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
  for insert with check (
    sender_user_id = (select auth.uid())
    and (
      exists (
        select 1
        from public.tenant_members tm
        where tm.tenant_id = task_messages.tenant_id
          and tm.user_id = (select auth.uid())
          and tm.role in ('owner', 'admin', 'member')
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
