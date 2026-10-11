-- Raw media storage is a contractor surface, not a customer publication API.
-- Preserve tenant/project prefix compatibility while checking current roles and
-- account status. A stakeholder membership alone must never sign/read/upload
-- arbitrary tenant objects (including objects of ungranted projects).
begin;

drop policy if exists media_insert_tenant on storage.objects;
drop policy if exists media_select_tenant on storage.objects;

create policy media_insert_tenant on storage.objects
for insert to authenticated
with check (
  bucket_id = 'media'
  and (
    (storage.foldername(name))[1] in (
      select t.id::text from public.tenants t
      where public.is_internal_tenant_writer_for_tenant(t.id)
        and app_private.customer_intake_tenant_account_active(t.id)
    )
    or (storage.foldername(name))[1] in (
      select p.id::text from public.projects p
      where public.is_internal_tenant_writer_for_tenant(p.tenant_id)
        and app_private.customer_intake_tenant_account_active(p.tenant_id)
    )
  )
);

create policy media_select_tenant on storage.objects
for select to authenticated
using (
  bucket_id = 'media'
  and (
    (storage.foldername(name))[1] in (
      select t.id::text from public.tenants t
      where public.is_internal_tenant_reader_for_tenant(t.id)
        and app_private.customer_intake_tenant_account_active(t.id)
    )
    or (storage.foldername(name))[1] in (
      select p.id::text from public.projects p
      where public.is_internal_tenant_reader_for_tenant(p.tenant_id)
        and app_private.customer_intake_tenant_account_active(p.tenant_id)
    )
  )
);

commit;
