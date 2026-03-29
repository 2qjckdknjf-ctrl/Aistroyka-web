-- Wave 4 Step 7 closure: remaining tenant-wide reads that still used unscoped tenant_members.

-- ---------------------------------------------------------------------------
-- Identity / SSO config (internal + tenant owner)
-- ---------------------------------------------------------------------------

drop policy if exists identity_providers_read on public.identity_providers;
create policy identity_providers_read on public.identity_providers for select using (
  tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
  or public.is_internal_tenant_reader_for_tenant(tenant_id)
);

-- ---------------------------------------------------------------------------
-- Export pipeline (admin/owner paths; tighten export_rows subquery)
-- ---------------------------------------------------------------------------

drop policy if exists export_batches_tenant on public.export_batches;
create policy export_batches_tenant on public.export_batches for select using (
  tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
  or public.is_internal_tenant_reader_for_tenant(tenant_id)
);

drop policy if exists export_rows_via_batch on public.export_rows;
create policy export_rows_via_batch on public.export_rows for select using (
  batch_id in (
    select eb.id from public.export_batches eb
    where eb.tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
       or public.is_internal_tenant_reader_for_tenant(eb.tenant_id)
  )
);

-- ---------------------------------------------------------------------------
-- Photo annotations / comments
-- ---------------------------------------------------------------------------

drop policy if exists photo_annotations_tenant on public.photo_annotations;
create policy photo_annotations_internal on public.photo_annotations for all using (
  tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
  or public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
  or public.is_internal_tenant_reader_for_tenant(tenant_id)
);

drop policy if exists photo_comments_tenant on public.photo_comments;
create policy photo_comments_internal on public.photo_comments for all using (
  tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
  or public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
  or public.is_internal_tenant_reader_for_tenant(tenant_id)
);
