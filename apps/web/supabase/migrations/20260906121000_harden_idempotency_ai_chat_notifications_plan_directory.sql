-- Release hardening Wave 6: close remaining #222-class direct PostgREST
-- forge/wipe/enumeration paths without changing product behavior.
-- Depends on Wave 1 helpers:
--   is_internal_tenant_writer_for_tenant(uuid)
--   project_belongs_to_tenant(uuid, uuid)
-- and Stage 1 RBAC helper:
--   can_read_project_membership(uuid, uuid)

-- ---------------------------------------------------------------------------
-- Notification recipient helper
-- ---------------------------------------------------------------------------

create or replace function public.notification_recipient_belongs_to_tenant(
  p_tenant_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenants t
    where t.id = p_tenant_id
      and t.user_id = p_user_id
  )
  or exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = p_user_id
      and tm.role in ('owner', 'admin', 'member', 'viewer')
  );
$$;

revoke all on function public.notification_recipient_belongs_to_tenant(uuid, uuid) from public;
grant execute on function public.notification_recipient_belongs_to_tenant(uuid, uuid)
  to authenticated, service_role;

comment on function public.notification_recipient_belongs_to_tenant(uuid, uuid) is
  'True when the notification recipient is an internal user of the same tenant; excludes portal-only stakeholders.';

-- ---------------------------------------------------------------------------
-- idempotency_keys: server/service-role only
-- All known production callers use getAdminClient(). Authenticated PostgREST
-- must not read, forge, update, or delete cached write responses.
-- ---------------------------------------------------------------------------

drop policy if exists idempotency_tenant on public.idempotency_keys;
drop policy if exists idempotency_internal on public.idempotency_keys;
drop policy if exists idempotency_keys_select_own on public.idempotency_keys;
drop policy if exists idempotency_keys_insert_own on public.idempotency_keys;
drop policy if exists idempotency_keys_update_own on public.idempotency_keys;
drop policy if exists idempotency_keys_delete_own on public.idempotency_keys;
drop policy if exists idempotency_keys_write_own on public.idempotency_keys;

-- Intentionally no authenticated policies. service_role bypasses RLS.

-- ---------------------------------------------------------------------------
-- AI chat: own thread + project access; no authenticated wipe paths.
-- Thread CRUD is still compatible with a user-JWT Edge function, but a user may
-- only operate on their own thread and only while they can read the project.
-- Messages remain append-only. Role provenance (user vs assistant/system) is a
-- separate server-writer follow-up because legacy Edge source is external here.
-- ---------------------------------------------------------------------------

drop policy if exists ai_chat_threads_tenant on public.ai_chat_threads;
drop policy if exists ai_chat_threads_select_internal on public.ai_chat_threads;
drop policy if exists ai_chat_threads_insert_internal on public.ai_chat_threads;
drop policy if exists ai_chat_threads_update_internal on public.ai_chat_threads;
drop policy if exists ai_chat_threads_delete_internal on public.ai_chat_threads;

create policy ai_chat_threads_select_own_project
  on public.ai_chat_threads
  for select
  to authenticated
  using (
    created_by = (select auth.uid())
    and public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy ai_chat_threads_insert_own_project
  on public.ai_chat_threads
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy ai_chat_threads_update_own_project
  on public.ai_chat_threads
  for update
  to authenticated
  using (
    created_by = (select auth.uid())
    and public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  )
  with check (
    created_by = (select auth.uid())
    and public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

-- No authenticated DELETE policy for threads.

drop policy if exists ai_chat_messages_tenant on public.ai_chat_messages;
drop policy if exists ai_chat_messages_select_internal on public.ai_chat_messages;
drop policy if exists ai_chat_messages_insert_internal on public.ai_chat_messages;
drop policy if exists ai_chat_messages_update_internal on public.ai_chat_messages;
drop policy if exists ai_chat_messages_delete_internal on public.ai_chat_messages;

create policy ai_chat_messages_select_own_project
  on public.ai_chat_messages
  for select
  to authenticated
  using (
    exists (
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

create policy ai_chat_messages_insert_own_project
  on public.ai_chat_messages
  for insert
  to authenticated
  with check (
    exists (
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

-- No authenticated UPDATE or DELETE policies for messages.

-- ---------------------------------------------------------------------------
-- manager_notifications: private inbox + constrained producer writes.
-- Readers can only see their own inbox. Authenticated writers may insert only
-- for a real internal recipient in the same tenant; project links must match.
-- Users may only mutate read_at on their own row; no authenticated DELETE.
-- ---------------------------------------------------------------------------

drop policy if exists manager_notifications_tenant_member on public.manager_notifications;
drop policy if exists manager_notifications_internal on public.manager_notifications;
drop policy if exists manager_notifications_select_own on public.manager_notifications;
drop policy if exists manager_notifications_insert_internal on public.manager_notifications;
drop policy if exists manager_notifications_update_own on public.manager_notifications;
drop policy if exists manager_notifications_delete_own on public.manager_notifications;

create policy manager_notifications_select_own
  on public.manager_notifications
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and public.is_internal_tenant_reader_for_tenant(tenant_id)
  );

create policy manager_notifications_insert_internal
  on public.manager_notifications
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.notification_recipient_belongs_to_tenant(tenant_id, user_id)
    and (
      project_id is null
      or public.project_belongs_to_tenant(project_id, tenant_id)
    )
  );

create policy manager_notifications_update_own
  on public.manager_notifications
  for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and public.is_internal_tenant_reader_for_tenant(tenant_id)
  )
  with check (
    user_id = (select auth.uid())
    and public.is_internal_tenant_reader_for_tenant(tenant_id)
  );

create or replace function public.enforce_manager_notification_read_only_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) is not null then
    if new.tenant_id is distinct from old.tenant_id
      or new.user_id is distinct from old.user_id
      or new.type is distinct from old.type
      or new.title is distinct from old.title
      or new.body is distinct from old.body
      or new.target_type is distinct from old.target_type
      or new.target_id is distinct from old.target_id
      or new.project_id is distinct from old.project_id
      or new.created_at is distinct from old.created_at then
      raise exception 'manager notification content is immutable';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_manager_notification_read_only_update() from public;
grant execute on function public.enforce_manager_notification_read_only_update()
  to authenticated, service_role;

drop trigger if exists trg_manager_notification_read_only_update on public.manager_notifications;
create trigger trg_manager_notification_read_only_update
before update on public.manager_notifications
for each row execute function public.enforce_manager_notification_read_only_update();

-- No authenticated DELETE policy.

-- ---------------------------------------------------------------------------
-- Plan fit persistence: readers may inspect; only writer cohort may change.
-- Matches application canManageProjects (member+) and excludes viewer.
-- ---------------------------------------------------------------------------

drop policy if exists plan_fit_recommendations_select on public.plan_fit_recommendations;
drop policy if exists plan_fit_recommendations_insert on public.plan_fit_recommendations;
drop policy if exists plan_fit_recommendations_update on public.plan_fit_recommendations;
drop policy if exists plan_fit_recommendations_delete on public.plan_fit_recommendations;

create policy plan_fit_recommendations_select
  on public.plan_fit_recommendations
  for select
  to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy plan_fit_recommendations_insert
  on public.plan_fit_recommendations
  for insert
  to authenticated
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

-- Recommendations are append-only at the authenticated RLS layer.

drop policy if exists workspace_plan_state_select on public.workspace_plan_state;
drop policy if exists workspace_plan_state_insert on public.workspace_plan_state;
drop policy if exists workspace_plan_state_update on public.workspace_plan_state;
drop policy if exists workspace_plan_state_delete on public.workspace_plan_state;

create policy workspace_plan_state_select
  on public.workspace_plan_state
  for select
  to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy workspace_plan_state_insert
  on public.workspace_plan_state
  for insert
  to authenticated
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

create policy workspace_plan_state_update
  on public.workspace_plan_state
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

-- No authenticated DELETE policy for selected workspace plan state.

-- ---------------------------------------------------------------------------
-- Internal contractor directory: reader/writer split; viewer stays read-only.
-- ---------------------------------------------------------------------------

drop policy if exists tenant_contractor_profiles_internal_rw on public.tenant_contractor_profiles;
drop policy if exists tenant_contractor_profiles_select_internal on public.tenant_contractor_profiles;
drop policy if exists tenant_contractor_profiles_insert_internal on public.tenant_contractor_profiles;
drop policy if exists tenant_contractor_profiles_update_internal on public.tenant_contractor_profiles;
drop policy if exists tenant_contractor_profiles_delete_internal on public.tenant_contractor_profiles;

create policy tenant_contractor_profiles_select_internal
  on public.tenant_contractor_profiles
  for select
  to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy tenant_contractor_profiles_insert_internal
  on public.tenant_contractor_profiles
  for insert
  to authenticated
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

create policy tenant_contractor_profiles_update_internal
  on public.tenant_contractor_profiles
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

create policy tenant_contractor_profiles_delete_internal
  on public.tenant_contractor_profiles
  for delete
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id));

-- ---------------------------------------------------------------------------
-- Stakeholder discussion entries: explicit manager vs portal participant paths.
-- Internal viewers/readers cannot forge entries or another author's identity.
-- ---------------------------------------------------------------------------

drop policy if exists stakeholder_discussion_entries_insert_internal on public.project_stakeholder_discussion_entries;
drop policy if exists stakeholder_discussion_entries_insert_portal on public.project_stakeholder_discussion_entries;
drop policy if exists stakeholder_discussion_entries_insert_combined on public.project_stakeholder_discussion_entries;

create policy stakeholder_discussion_entries_insert_internal
  on public.project_stakeholder_discussion_entries
  for insert
  to authenticated
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
    and author_user_id = (select auth.uid())
  );

create policy stakeholder_discussion_entries_insert_portal
  on public.project_stakeholder_discussion_entries
  for insert
  to authenticated
  with check (
    public.is_portal_stakeholder_for_project(project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
    and author_user_id = (select auth.uid())
  );
