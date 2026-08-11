-- CRITICAL: close PostgREST wipe/forge holes on photo collaboration tables.
--
-- Concrete triggers (authenticated JWT, PostgREST):
--   DELETE /rest/v1/photo_annotations?tenant_id=eq.<tid>
--   DELETE /rest/v1/photo_comments?tenant_id=eq.<tid>
--   PATCH /rest/v1/photo_comments?id=eq.<id>  { "body":"forged" }
--   POST /rest/v1/photo_comments  { author_user_id: "<other>", ... }
--
-- App APIs only expose:
--   POST annotations / PATCH annotations / POST comments / GET collab
-- Comments are append-only (docs/COLLAB-ANNOTATIONS-CONFLICTS.md).
-- Role matrix: media:upload >= member; media:read >= viewer.
-- Prior FOR ALL policies used is_internal_tenant_reader_for_tenant (includes
-- viewer) with no author bind and no revoke of UPDATE/DELETE on comments.
--
-- Helper create-or-replace matches open PRs #210/#212/#213/#216/#218 so
-- migration order is safe.

-- ---------------------------------------------------------------------------
-- Helpers (idempotent with 20260806120000 / 20260807120000 / 20260808110000 /
-- 20260809110000 / 20260810110000)
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

-- ---------------------------------------------------------------------------
-- photo_annotations: readers can SELECT; writers insert/update; no authenticated DELETE
-- ---------------------------------------------------------------------------

drop policy if exists photo_annotations_tenant on public.photo_annotations;
drop policy if exists photo_annotations_internal on public.photo_annotations;
drop policy if exists photo_annotations_select_internal on public.photo_annotations;
drop policy if exists photo_annotations_insert_internal on public.photo_annotations;
drop policy if exists photo_annotations_update_internal on public.photo_annotations;
drop policy if exists photo_annotations_delete_internal on public.photo_annotations;

create policy photo_annotations_select_internal on public.photo_annotations
  for select
  to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy photo_annotations_insert_internal on public.photo_annotations
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and author_user_id = (select auth.uid())
  );

-- Writers may update workspace annotations (matches PATCH API for member+).
create policy photo_annotations_update_internal on public.photo_annotations
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

-- No DELETE policy: authenticated clients cannot wipe annotations via PostgREST.
-- Service role retains full access for operator/admin paths.

-- ---------------------------------------------------------------------------
-- photo_comments: append-only for writers; readers can SELECT; no UPDATE/DELETE
-- ---------------------------------------------------------------------------

drop policy if exists photo_comments_tenant on public.photo_comments;
drop policy if exists photo_comments_internal on public.photo_comments;
drop policy if exists photo_comments_select_internal on public.photo_comments;
drop policy if exists photo_comments_insert_internal on public.photo_comments;
drop policy if exists photo_comments_update_internal on public.photo_comments;
drop policy if exists photo_comments_delete_internal on public.photo_comments;

create policy photo_comments_select_internal on public.photo_comments
  for select
  to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy photo_comments_insert_internal on public.photo_comments
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and author_user_id = (select auth.uid())
  );

-- No UPDATE/DELETE policies: comments stay append-only at the RLS layer.
