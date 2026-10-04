-- Task chat authorization must come from project role or task assignment.
-- tenant_members.role = 'member' is also used by field workers, so it cannot
-- confer tenant-wide chat access or moderation rights.

drop policy if exists task_messages_select on public.task_messages;
drop policy if exists task_messages_insert on public.task_messages;
drop policy if exists task_messages_update on public.task_messages;

create policy task_messages_select on public.task_messages
  for select using (
    deleted_at is null
    and exists (
      select 1
      from public.worker_tasks wt
      where wt.id = task_messages.task_id
        and wt.tenant_id = task_messages.tenant_id
        and wt.project_id = task_messages.project_id
        and (
          public.can_manage_project_membership(
            task_messages.tenant_id,
            task_messages.project_id
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

create policy task_messages_insert on public.task_messages
  for insert with check (
    sender_user_id = (select auth.uid())
    and exists (
      select 1
      from public.worker_tasks wt
      where wt.id = task_messages.task_id
        and wt.tenant_id = task_messages.tenant_id
        and wt.project_id = task_messages.project_id
        and (
          public.can_manage_project_membership(
            task_messages.tenant_id,
            task_messages.project_id
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

-- The API performs sender/manager authorization and writes soft deletes with
-- the service-role client. Direct UPDATE would also permit editing immutable
-- message columns, so authenticated clients must not receive table UPDATE.
revoke update on table public.task_messages from anon, authenticated;
