-- Fix missing RLS policies and indexes
-- Date: 2026-03-07
-- Stage 4: Database & Data Integrity

-- ============================================================================
-- 1. Add missing RLS policies (CRITICAL - Security)
-- ============================================================================

-- rate_limit_slots: Tenant-scoped rate limiting
create policy if not exists rate_limit_slots_tenant on public.rate_limit_slots
  for all using (
    key like (select 'tenant:' || id::text || ':%' from public.tenant_members where user_id = auth.uid() limit 1)
  );

-- ai_usage: Tenant-scoped AI usage tracking
create policy if not exists ai_usage_tenant on public.ai_usage
  for all using (
    tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  );

-- tenant_billing_state: Tenant-scoped billing state
create policy if not exists tenant_billing_state_tenant on public.tenant_billing_state
  for all using (
    tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  );

-- tenant_concurrency: Tenant-scoped concurrency limits
alter table if exists public.tenant_concurrency enable row level security;
create policy if not exists tenant_concurrency_tenant on public.tenant_concurrency
  for all using (
    tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  );

-- ============================================================================
-- 2. Add missing indexes on foreign keys (Performance)
-- ============================================================================

-- worker_reports.day_id
create index if not exists idx_worker_reports_day_id on public.worker_reports(day_id) where day_id is not null;

-- worker_report_media.media_id
create index if not exists idx_worker_report_media_media_id on public.worker_report_media(media_id) where media_id is not null;

-- worker_report_media.upload_session_id
create index if not exists idx_worker_report_media_upload_session_id on public.worker_report_media(upload_session_id) where upload_session_id is not null;

-- worker_tasks.project_id
create index if not exists idx_worker_tasks_project_id on public.worker_tasks(project_id) where project_id is not null;

-- worker_tasks.assigned_to
create index if not exists idx_worker_tasks_assigned_to on public.worker_tasks(assigned_to) where assigned_to is not null;

-- photo_annotations.media_id (if table exists)
create index if not exists idx_photo_annotations_media_id on public.photo_annotations(media_id) where media_id is not null;

-- photo_comments.media_id (if table exists)
create index if not exists idx_photo_comments_media_id on public.photo_comments(media_id) where media_id is not null;

-- change_log.resource_id
create index if not exists idx_change_log_resource_id on public.change_log(resource_id);

-- organization_tenants.tenant_id
create index if not exists idx_organization_tenants_tenant_id on public.organization_tenants(tenant_id);

-- task_assignments.task_id
create index if not exists idx_task_assignments_task_id on public.task_assignments(task_id);

-- ============================================================================
-- 3. Add missing indexes on frequently queried columns (Performance)
-- ============================================================================

-- ai_usage.user_id
create index if not exists idx_ai_usage_user_id on public.ai_usage(user_id) where user_id is not null;

-- ai_usage.trace_id
create index if not exists idx_ai_usage_trace_id on public.ai_usage(trace_id) where trace_id is not null;

-- jobs.user_id
create index if not exists idx_jobs_user_id on public.jobs(user_id) where user_id is not null;

-- jobs.trace_id
create index if not exists idx_jobs_trace_id on public.jobs(trace_id) where trace_id is not null;

-- jobs.locked_by
create index if not exists idx_jobs_locked_by on public.jobs(locked_by) where locked_by is not null;

-- upload_sessions.status
create index if not exists idx_upload_sessions_status on public.upload_sessions(status);

-- push_outbox.user_id
create index if not exists idx_push_outbox_user_id on public.push_outbox(user_id) where user_id is not null;

-- push_outbox.platform
create index if not exists idx_push_outbox_platform on public.push_outbox(platform);

-- device_tokens.token (for lookups)
create index if not exists idx_device_tokens_token on public.device_tokens(token) where token is not null;

-- sso_sessions.nonce
create index if not exists idx_sso_sessions_nonce on public.sso_sessions(nonce) where nonce is not null;

-- ============================================================================
-- 4. Add composite indexes for common query patterns (Performance)
-- ============================================================================

-- jobs(tenant_id, user_id, created_at) - for user-specific job queries
create index if not exists idx_jobs_tenant_user_created on public.jobs(tenant_id, user_id, created_at desc) where user_id is not null;

-- ai_usage(tenant_id, user_id, created_at) - for user-specific usage queries
create index if not exists idx_ai_usage_tenant_user_created on public.ai_usage(tenant_id, user_id, created_at desc) where user_id is not null;

-- events(tenant_id, user_id, ts) - for user-specific event queries
create index if not exists idx_events_tenant_user_ts on public.events(tenant_id, user_id, ts desc) where user_id is not null and tenant_id is not null;
