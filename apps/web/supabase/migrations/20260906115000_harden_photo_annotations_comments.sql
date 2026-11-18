-- RELEASE HARDENING WAVE 5
-- Close #220-class direct PostgREST wipe/forge paths for photo collaboration.
--
-- App write routes are member+ (`canManageProjects`). RLS mirrors that writer
-- cohort, preserves internal-reader SELECT, binds authors on INSERT, validates
-- media/tenant consistency, and keeps comments append-only.

-- ---------------------------------------------------------------------------
-- Helper: referenced media must belong to the same tenant as the collab row.
-- ---------------------------------------------------------------------------

create or replace function public.media_belongs_to_tenant(p_media_id uuid, p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.media m
    where m.id = p_media_id
      and m.tenant_id = p_tenant_id
  );
$$;

revoke all on function public.media_belongs_to_tenant(uuid, uuid) from public;
grant execute on function public.media_belongs_to_tenant(uuid, uuid) to authenticated, service_role;

comment on function public.media_belongs_to_tenant(uuid, uuid) is
  'True when media.id belongs to the supplied tenant; blocks cross-tenant media references.';

-- ---------------------------------------------------------------------------
-- photo_annotations
-- SELECT: internal readers (viewer remains read-only).
-- INSERT: tenant writer + own author identity + media/tenant consistency.
-- UPDATE: tenant writer + media/tenant consistency; identity columns immutable.
-- DELETE: no authenticated policy (application exposes no delete flow).
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
    and public.media_belongs_to_tenant(media_id, tenant_id)
  );

create policy photo_annotations_update_internal on public.photo_annotations
  for update
  to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.media_belongs_to_tenant(media_id, tenant_id)
  );

create or replace function public.enforce_photo_annotation_identity_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if new.tenant_id is distinct from old.tenant_id
     or new.media_id is distinct from old.media_id
     or new.author_user_id is distinct from old.author_user_id
     or new.created_at is distinct from old.created_at then
    raise exception 'photo annotation identity fields are immutable';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_photo_annotation_identity_immutable() from public;

drop trigger if exists photo_annotations_enforce_identity_immutable on public.photo_annotations;
create trigger photo_annotations_enforce_identity_immutable
  before update on public.photo_annotations
  for each row
  execute function public.enforce_photo_annotation_identity_immutable();

comment on function public.enforce_photo_annotation_identity_immutable() is
  'Prevents authenticated direct REST updates from moving/re-attributing an existing annotation.';

-- ---------------------------------------------------------------------------
-- photo_comments
-- SELECT: internal readers.
-- INSERT: tenant writer + own author identity + media/tenant consistency.
-- UPDATE/DELETE: intentionally no authenticated policies; comments are append-only.
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
    and public.media_belongs_to_tenant(media_id, tenant_id)
  );
