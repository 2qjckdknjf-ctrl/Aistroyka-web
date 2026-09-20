-- A tenant member maps to WORKER, not MANAGER. Restrict tenant-wide task-chat
-- access to owner/admin and require every other role to be assigned to the task.
-- Also deny direct PostgREST updates so an allowed sender/moderator cannot
-- rewrite message content or ownership metadata. Soft-delete stays behind the
-- server API, which already uses the service-role client after authorization.

drop policy if exists task_messages_select on public.task_messages;
drop policy if exists task_messages_insert on public.task_messages;
drop policy if exists task_messages_update on public.task_messages;

create policy task_messages_select on public.task_messages
  for select using (
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

revoke update on table public.task_messages from anon, authenticated;
