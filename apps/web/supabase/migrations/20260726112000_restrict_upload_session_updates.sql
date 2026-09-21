-- upload_sessions previously used a single FOR ALL policy for any internal
-- tenant reader (owner/admin/member/viewer). That let a peer rewrite another
-- user's finalized session (user_id, purpose, size_bytes, object_path) via
-- PostgREST and then attach that media to task chat under their own identity.
--
-- Keep tenant-wide SELECT for managers; restrict INSERT/UPDATE to the
-- session owner. Revoke column updates that would change ownership or purpose.

drop policy if exists upload_sessions_internal on public.upload_sessions;

create policy upload_sessions_select_internal on public.upload_sessions
  for select
  to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy upload_sessions_insert_own on public.upload_sessions
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_internal_tenant_reader_for_tenant(tenant_id)
  );

create policy upload_sessions_update_own on public.upload_sessions
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

-- Authenticated clients may only finalize/bind media metadata on their own rows.
-- Ownership (user_id) and purpose stay immutable from PostgREST; service_role
-- retains full table privileges for jobs/admin.
revoke update on table public.upload_sessions from authenticated;
grant update (status, object_path, mime_type, size_bytes, archived_at) on public.upload_sessions to authenticated;
