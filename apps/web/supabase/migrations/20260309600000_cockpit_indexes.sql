-- Cockpit list/stuck queries: index for upload_sessions filtered by tenant, status, created_at.
create index if not exists idx_upload_sessions_tenant_status_created
  on public.upload_sessions(tenant_id, status, created_at);
