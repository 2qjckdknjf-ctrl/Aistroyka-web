-- Wave 4 Step 7 closure (continued): tenant-wide tables where any tenant_members row was too broad.
-- Depends on public.is_internal_tenant_reader_for_tenant(uuid) from 20260329140000.

-- ---------------------------------------------------------------------------
-- Sync engine
-- ---------------------------------------------------------------------------

drop policy if exists sync_cursors_tenant on public.sync_cursors;
create policy sync_cursors_internal on public.sync_cursors for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

drop policy if exists change_log_tenant_select on public.change_log;
drop policy if exists change_log_insert on public.change_log;
create policy change_log_select on public.change_log for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);
create policy change_log_insert on public.change_log for insert with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

-- ---------------------------------------------------------------------------
-- Jobs
-- ---------------------------------------------------------------------------

drop policy if exists jobs_tenant on public.jobs;
create policy jobs_internal on public.jobs for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

drop policy if exists job_events_via_job on public.job_events;
create policy job_events_internal on public.job_events for all using (
  job_id in (
    select j.id from public.jobs j
    where public.is_internal_tenant_reader_for_tenant(j.tenant_id)
  )
) with check (
  job_id in (
    select j.id from public.jobs j
    where public.is_internal_tenant_reader_for_tenant(j.tenant_id)
  )
);

-- ---------------------------------------------------------------------------
-- RBAC user_scopes
-- ---------------------------------------------------------------------------

drop policy if exists user_scopes_tenant on public.user_scopes;
create policy user_scopes_internal on public.user_scopes for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

-- ---------------------------------------------------------------------------
-- Idempotency
-- ---------------------------------------------------------------------------

drop policy if exists idempotency_tenant on public.idempotency_keys;
create policy idempotency_internal on public.idempotency_keys for all using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
) with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

-- ---------------------------------------------------------------------------
-- Ops events
-- ---------------------------------------------------------------------------

drop policy if exists ops_events_select on public.ops_events;
drop policy if exists ops_events_insert on public.ops_events;
create policy ops_events_select on public.ops_events for select using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
  or tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
);
create policy ops_events_insert on public.ops_events for insert with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
  or tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
);

-- ---------------------------------------------------------------------------
-- Tenant feature flags (per-tenant overrides; not global feature_flags)
-- ---------------------------------------------------------------------------

drop policy if exists tenant_feature_flags_read on public.tenant_feature_flags;
create policy tenant_feature_flags_read on public.tenant_feature_flags for select using (
  tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
  or public.is_internal_tenant_reader_for_tenant(tenant_id)
);

-- ---------------------------------------------------------------------------
-- Tenant data plane metadata
-- ---------------------------------------------------------------------------

drop policy if exists tenant_data_plane_read on public.tenant_data_plane;
create policy tenant_data_plane_read on public.tenant_data_plane for select using (
  tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
  or public.is_internal_tenant_reader_for_tenant(tenant_id)
);

-- ---------------------------------------------------------------------------
-- Entitlements (billing_customers already restricted to owner/admin or tenant owner)
-- ---------------------------------------------------------------------------

drop policy if exists entitlements_own on public.entitlements;
create policy entitlements_own on public.entitlements for select using (
  tenant_id in (select id from public.tenants where user_id = (select auth.uid()))
  or public.is_internal_tenant_reader_for_tenant(tenant_id)
);

-- ---------------------------------------------------------------------------
-- Audit logs insert: internal workspace only (not portal stakeholder)
-- ---------------------------------------------------------------------------

drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs for insert with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);
