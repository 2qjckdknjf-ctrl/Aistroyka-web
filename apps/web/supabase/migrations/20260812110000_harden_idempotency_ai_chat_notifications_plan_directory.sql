-- CRITICAL: close PostgREST wipe/forge holes on idempotency cache, AI chat,
-- manager inbox, plan-fit state, contractor directory, and discussion entries.
--
-- Concrete triggers (authenticated JWT, PostgREST):
--   DELETE /rest/v1/idempotency_keys?tenant_id=eq.<tid>
--     → mobile retries re-execute writes (duplicate reports/media/day)
--   POST /rest/v1/idempotency_keys
--     { key, tenant_id, user_id:<worker>, route, response, status_code, expires_at }
--     → service-role lite idempotency returns forged success without running handler
--   DELETE /rest/v1/ai_chat_threads?tenant_id=eq.<tid>
--   DELETE /rest/v1/ai_chat_messages?tenant_id=eq.<tid>
--   DELETE /rest/v1/manager_notifications?tenant_id=eq.<tid>
--   POST/PATCH /rest/v1/workspace_plan_state  { "canonical_plan_code":"ENTERPRISE" }
--   DELETE /rest/v1/tenant_contractor_profiles?tenant_id=eq.<tid>
--   POST /rest/v1/project_stakeholder_discussion_entries
--     { author_user_id:<other>, entry_kind:"resolution_note", ... }
--
-- App/API already uses service role for idempotency; copilot has no DELETE;
-- notifications mark-read is own-row only; plan-fit select/recommend and
-- contractor directory require canManageProjects; discussion entries require
-- manage/participant gates + author = caller. Prior RLS used reader FOR ALL
-- (includes viewer) or bare tenant_members with no author bind.
--
-- Helper create-or-replace matches open PRs #210/#212/#213/#216/#218/#220 so
-- migration order is safe.

-- ---------------------------------------------------------------------------
-- Helpers (idempotent with 20260806120000 … 20260811110000)
-- ---------------------------------------------------------------------------

create or replace function public.is_internal_tenant_writer_for_tenant(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenants t
    where t.id = p_tenant_id and t.user_id = (select auth.uid())
  )
  or exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner', 'admin', 'member')
  );
$$;

revoke all on function public.is_internal_tenant_writer_for_tenant(uuid) from public;
grant execute on function public.is_internal_tenant_writer_for_tenant(uuid) to authenticated, service_role;

comment on function public.is_internal_tenant_writer_for_tenant(uuid) is
  'True for tenant owner/admin/member (excludes viewer). Used for non-commercial workspace writes.';

create or replace function public.project_belongs_to_tenant(p_project_id uuid, p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.tenant_id = p_tenant_id
  );
$$;

revoke all on function public.project_belongs_to_tenant(uuid, uuid) from public;
grant execute on function public.project_belongs_to_tenant(uuid, uuid) to authenticated, service_role;

comment on function public.project_belongs_to_tenant(uuid, uuid) is
  'True when projects.id belongs to the given tenant_id (blocks cross-tenant FK writes).';

-- ---------------------------------------------------------------------------
-- idempotency_keys: service-role only (API always uses getAdminClient)
-- ---------------------------------------------------------------------------

drop policy if exists idempotency_tenant on public.idempotency_keys;
drop policy if exists idempotency_internal on public.idempotency_keys;
drop policy if exists idempotency_keys_select_own on public.idempotency_keys;
drop policy if exists idempotency_keys_write_own on public.idempotency_keys;

-- No authenticated policies: PostgREST clients cannot read/forge/wipe keys.
-- service_role bypasses RLS for lite/web idempotency helpers.

-- ---------------------------------------------------------------------------
-- ai_chat_threads / ai_chat_messages: readers may chat; no authenticated DELETE
-- ---------------------------------------------------------------------------

drop policy if exists ai_chat_threads_tenant on public.ai_chat_threads;
drop policy if exists ai_chat_threads_select_internal on public.ai_chat_threads;
drop policy if exists ai_chat_threads_insert_internal on public.ai_chat_threads;
drop policy if exists ai_chat_threads_update_internal on public.ai_chat_threads;
drop policy if exists ai_chat_threads_delete_internal on public.ai_chat_threads;

create policy ai_chat_threads_select_internal on public.ai_chat_threads
  for select
  to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy ai_chat_threads_insert_internal on public.ai_chat_threads
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy ai_chat_threads_update_internal on public.ai_chat_threads
  for update
  to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

-- No DELETE policy: authenticated clients cannot wipe copilot history via PostgREST.

drop policy if exists ai_chat_messages_tenant on public.ai_chat_messages;
drop policy if exists ai_chat_messages_select_internal on public.ai_chat_messages;
drop policy if exists ai_chat_messages_insert_internal on public.ai_chat_messages;
drop policy if exists ai_chat_messages_update_internal on public.ai_chat_messages;
drop policy if exists ai_chat_messages_delete_internal on public.ai_chat_messages;

create policy ai_chat_messages_select_internal on public.ai_chat_messages
  for select
  to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy ai_chat_messages_insert_internal on public.ai_chat_messages
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

-- No UPDATE/DELETE: messages stay append-only at the RLS layer.

-- ---------------------------------------------------------------------------
-- manager_notifications: own inbox read/mark-read; writers may insert; no DELETE
-- ---------------------------------------------------------------------------

drop policy if exists manager_notifications_tenant_member on public.manager_notifications;
drop policy if exists manager_notifications_internal on public.manager_notifications;
drop policy if exists manager_notifications_select_own on public.manager_notifications;
drop policy if exists manager_notifications_insert_internal on public.manager_notifications;
drop policy if exists manager_notifications_update_own on public.manager_notifications;
drop policy if exists manager_notifications_delete_own on public.manager_notifications;

create policy manager_notifications_select_own on public.manager_notifications
  for select
  to authenticated
  using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and user_id = (select auth.uid())
  );

-- Report/issue/task assign paths insert manager rows via the caller's JWT.
create policy manager_notifications_insert_internal on public.manager_notifications
  for insert
  to authenticated
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

create policy manager_notifications_update_own on public.manager_notifications
  for update
  to authenticated
  using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and user_id = (select auth.uid())
  )
  with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and user_id = (select auth.uid())
  );

-- No DELETE policy: authenticated clients cannot wipe manager inboxes.

-- ---------------------------------------------------------------------------
-- workspace_plan_state / plan_fit_recommendations: manage/writer writes only
-- Matches canManageProjects (member+); viewers stay read-only.
-- ---------------------------------------------------------------------------

drop policy if exists workspace_plan_state_select on public.workspace_plan_state;
drop policy if exists workspace_plan_state_insert on public.workspace_plan_state;
drop policy if exists workspace_plan_state_update on public.workspace_plan_state;

create policy workspace_plan_state_select on public.workspace_plan_state
  for select
  to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy workspace_plan_state_insert on public.workspace_plan_state
  for insert
  to authenticated
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

create policy workspace_plan_state_update on public.workspace_plan_state
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists plan_fit_recommendations_select on public.plan_fit_recommendations;
drop policy if exists plan_fit_recommendations_insert on public.plan_fit_recommendations;

create policy plan_fit_recommendations_select on public.plan_fit_recommendations
  for select
  to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy plan_fit_recommendations_insert on public.plan_fit_recommendations
  for insert
  to authenticated
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

-- ---------------------------------------------------------------------------
-- tenant_contractor_profiles: readers SELECT; writers mutate (canManageProjects)
-- ---------------------------------------------------------------------------

drop policy if exists tenant_contractor_profiles_internal_rw on public.tenant_contractor_profiles;
drop policy if exists tenant_contractor_profiles_select_internal on public.tenant_contractor_profiles;
drop policy if exists tenant_contractor_profiles_insert_internal on public.tenant_contractor_profiles;
drop policy if exists tenant_contractor_profiles_update_internal on public.tenant_contractor_profiles;
drop policy if exists tenant_contractor_profiles_delete_internal on public.tenant_contractor_profiles;

create policy tenant_contractor_profiles_select_internal on public.tenant_contractor_profiles
  for select
  to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy tenant_contractor_profiles_insert_internal on public.tenant_contractor_profiles
  for insert
  to authenticated
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

create policy tenant_contractor_profiles_update_internal on public.tenant_contractor_profiles
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

create policy tenant_contractor_profiles_delete_internal on public.tenant_contractor_profiles
  for delete
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id));

-- ---------------------------------------------------------------------------
-- project_stakeholder_discussion_entries: manage cohort + author bind (portal kept)
-- ---------------------------------------------------------------------------

drop policy if exists stakeholder_discussion_entries_insert_internal on public.project_stakeholder_discussion_entries;
drop policy if exists stakeholder_discussion_entries_insert_portal on public.project_stakeholder_discussion_entries;
drop policy if exists stakeholder_discussion_entries_insert_combined on public.project_stakeholder_discussion_entries;

create policy stakeholder_discussion_entries_insert_internal on public.project_stakeholder_discussion_entries
  for insert
  to authenticated
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
    and author_user_id = (select auth.uid())
  );

create policy stakeholder_discussion_entries_insert_portal on public.project_stakeholder_discussion_entries
  for insert
  to authenticated
  with check (
    public.is_portal_stakeholder_for_project(project_id)
    and author_user_id = (select auth.uid())
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );
