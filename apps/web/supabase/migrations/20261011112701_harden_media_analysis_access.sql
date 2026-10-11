-- Re-slice #206 without reopening client job writes or granting viewer writes.
-- The private account helper is already verified by migration receipts.
do $$
begin
  if to_regprocedure('app_private.customer_intake_tenant_account_active(uuid)') is null then
    raise exception 'Verified private account guard is required';
  end if;
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename in ('media', 'ai_analysis')
    and policyname not in ('media_tenant', 'media_select_internal', 'media_select_portal',
      'media_insert_internal', 'media_update_internal', 'media_delete_internal',
      'media_select_scoped', 'media_insert_scoped', 'media_update_scoped', 'media_delete_scoped',
      'ai_analysis_tenant', 'ai_analysis_select_internal', 'ai_analysis_insert_internal',
      'ai_analysis_update_internal', 'ai_analysis_delete_internal', 'ai_analysis_select_scoped')
  ) then
    raise exception 'Unexpected media/analysis policy requires explicit review';
  end if;
end;
$$;

alter table public.media enable row level security;
drop policy if exists media_tenant on public.media;
drop policy if exists media_select_internal on public.media;
drop policy if exists media_select_portal on public.media;
drop policy if exists media_insert_internal on public.media;
drop policy if exists media_update_internal on public.media;
drop policy if exists media_delete_internal on public.media;
drop policy if exists media_select_scoped on public.media;
drop policy if exists media_insert_scoped on public.media;
drop policy if exists media_update_scoped on public.media;
drop policy if exists media_delete_scoped on public.media;

create policy media_select_scoped on public.media for select to authenticated
using (
  app_private.customer_intake_tenant_account_active(tenant_id)
  and (public.is_internal_tenant_reader_for_tenant(tenant_id)
    or (project_id is not null
      and app_private.customer_intake_stakeholder_authorized(project_id, tenant_id)
      and exists (select 1 from public.projects p
        where p.id = media.project_id and p.tenant_id = media.tenant_id
          and p.client_portal_enabled)))
);
create policy media_insert_scoped on public.media for insert to authenticated
with check (public.is_internal_tenant_writer_for_tenant(tenant_id)
  and app_private.customer_intake_tenant_account_active(tenant_id));
create policy media_update_scoped on public.media for update to authenticated
using (public.is_internal_tenant_writer_for_tenant(tenant_id)
  and app_private.customer_intake_tenant_account_active(tenant_id))
with check (public.is_internal_tenant_writer_for_tenant(tenant_id)
  and app_private.customer_intake_tenant_account_active(tenant_id));
create policy media_delete_scoped on public.media for delete to authenticated
using (public.is_internal_tenant_writer_for_tenant(tenant_id)
  and app_private.customer_intake_tenant_account_active(tenant_id));

-- A user belonging to two tenants still cannot transfer a media identity.
create or replace function app_private.media_client_identity_immutable()
returns trigger language plpgsql security invoker set search_path = pg_catalog
as $$
begin
  if auth.role() is distinct from 'service_role' and (
    new.id is distinct from old.id or new.tenant_id is distinct from old.tenant_id
    or new.project_id is distinct from old.project_id or new.type is distinct from old.type
  ) then
    raise exception 'Media identity is immutable for clients' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists media_client_identity_immutable_trg on public.media;
create trigger media_client_identity_immutable_trg before update on public.media
for each row execute function app_private.media_client_identity_immutable();
revoke all on function app_private.media_client_identity_immutable() from public, anon, authenticated;
grant execute on function app_private.media_client_identity_immutable() to service_role;

alter table public.ai_analysis enable row level security;
drop policy if exists ai_analysis_tenant on public.ai_analysis;
drop policy if exists ai_analysis_select_internal on public.ai_analysis;
drop policy if exists ai_analysis_insert_internal on public.ai_analysis;
drop policy if exists ai_analysis_update_internal on public.ai_analysis;
drop policy if exists ai_analysis_delete_internal on public.ai_analysis;
drop policy if exists ai_analysis_select_scoped on public.ai_analysis;
create policy ai_analysis_select_scoped on public.ai_analysis for select to authenticated
using (exists (
  select 1 from public.media m where m.id = ai_analysis.media_id
  and public.is_internal_tenant_reader_for_tenant(m.tenant_id)
  and app_private.customer_intake_tenant_account_active(m.tenant_id)
));

revoke all on public.media from public, anon;
revoke truncate, references, trigger on public.media from authenticated;
grant select, insert, update, delete on public.media to authenticated;
revoke all on public.ai_analysis from public, anon, authenticated;
grant select on public.ai_analysis to authenticated;
grant all on public.media, public.ai_analysis to service_role;
-- analysis_jobs policies/grants/triggers intentionally remain unchanged.
