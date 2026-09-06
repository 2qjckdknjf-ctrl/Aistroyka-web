-- RELEASE HARDENING WAVE 9B
-- Authenticated users may append only their own USER messages.
-- Assistant/system provenance is server-owned and must use service_role.
-- Depends on Wave 6 ai_chat_messages_select_own_project / insert_own_project.

drop policy if exists ai_chat_messages_insert_own_project on public.ai_chat_messages;

create policy ai_chat_messages_insert_own_project
  on public.ai_chat_messages
  for insert
  to authenticated
  with check (
    role = 'user'
    and exists (
      select 1
      from public.ai_chat_threads t
      where t.id = ai_chat_messages.thread_id
        and t.tenant_id = ai_chat_messages.tenant_id
        and t.project_id = ai_chat_messages.project_id
        and t.created_by = (select auth.uid())
        and public.is_internal_tenant_reader_for_tenant(t.tenant_id)
        and public.can_read_project_membership(t.tenant_id, t.project_id)
        and public.project_belongs_to_tenant(t.project_id, t.tenant_id)
    )
  );

comment on policy ai_chat_messages_insert_own_project on public.ai_chat_messages is
  'Authenticated clients may append only role=user messages to their own authorized project thread. Assistant/system messages are trusted server/service-role writes.';
