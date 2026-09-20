-- task_messages updates are only used for soft deletion. The original policy
-- treated tenant "member" as manager-capable, but that role is also assigned to
-- field workers. A worker could therefore update any message visible to them,
-- including messages sent by a manager.

drop policy if exists task_messages_update on public.task_messages;

-- Prevent authenticated clients from changing message ownership, routing, or
-- content through PostgREST. The service-role client retains its own grants.
revoke update on table public.task_messages from authenticated;
grant update (deleted_at) on public.task_messages to authenticated;

create policy task_messages_update on public.task_messages
  for update
  to authenticated
  using (
    sender_user_id = (select auth.uid())
    or exists (
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
  )
  with check (
    sender_user_id = (select auth.uid())
    or exists (
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
  );
