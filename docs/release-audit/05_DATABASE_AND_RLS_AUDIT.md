# Release Audit — Phase 5: Database / Migrations / RLS Audit

**Generated:** Release Readiness Audit

---

## 1. Schema Readiness Summary

- **Migrations:** 46 files under apps/web/supabase/migrations; naming 20260303–20260306; sequential.
- **Base:** 20260303000000_base_tenants_projects.sql — tenants, tenant_members, projects; RLS enabled; policies for select (tenant/member), insert/update service.
- **Core tables:** jobs, job_events, upload_sessions, worker_tasks, worker_reports, sync (change_log, cursors), ai_usage, idempotency_keys, rate_limit_slots, tenant_daily_metrics, rbac (roles, permissions, role_permissions, user_scopes), organizations, feature_flags, billing_entitlements, ops_events, manager_notifications, etc.
- **Relationships:** tenant_id FK on tenant-scoped tables; project_id, report_id, task_id where appropriate; auth.users referenced where needed.
- **Indexes:** Present for claim (jobs), tenant/user (upload_sessions), expires_at, tenant_id, etc. Cockpit indexes migration present.

---

## 2. Migration Readiness Summary

- **Ordering:** Chronological; no future-dated or duplicate filenames observed.
- **Idempotency:** Many use "create table if not exists", "create index if not exists"; some use "on conflict do nothing" for seeds.
- **Rollback:** No down migrations in repo; forward-only.
- **Blocker:** None. Apply in order against target Supabase instance.

---

## 3. Security Readiness Summary (RLS)

- **RLS enabled:** On tenants, tenant_members, projects, jobs, job_events, upload_sessions, and other tenant-scoped tables (evidenced by grep: 25+ migrations with enable row level security / create policy).
- **Tenant isolation:** Policies use "tenant_id in (select tenant_id from tenant_members where user_id = auth.uid())" or equivalent.
- **Service role:** Insert/update policies with "using (true)" or "with check (true)" for service role operations; application uses getAdminClient() for cron, jobs, billing, AI usage.
- **Public exposure:** No table left without RLS that holds tenant/user data; service-only policies restrict to backend.
- **Storage bucket policies:** Not fully audited in repo (Supabase dashboard); CONFIG-DEPENDENT. Recommend validating bucket RLS in live env.

---

## 4. Specific Checks

| Item | Status | Notes |
|------|--------|-------|
| Duplicate migrations | OK | No duplicates found |
| Missing indexes | OK | Key query paths indexed (jobs claim, upload_sessions tenant/expires) |
| Nullable integrity | OK | Critical FKs not null; some optional fields nullable by design |
| Enum consistency | OK | status/role checks in migrations |
| Report/task/media/user links | OK | worker_reports.task_id, project_id; media linkage in schema |
| AI logging tables | OK | ai_usage, ai_policy_decisions migrations |
| Audit/event tables | OK | job_events, ops_events |
| Push/device tables | OK | Migrations for devices, push outbox |
| Upload/session tables | OK | upload_sessions with RLS |

---

## 5. Release Blockers (DB)

- **P0:** None.
- **P1:** Ensure all migrations applied in order before release; verify storage bucket policies in Supabase for production buckets.
- **P2:** Document migration runbook (db:migrate script present).

---

## 6. Classification

- **P0 release blocker:** 0
- **P1 high risk:** 0 (migration order and storage verification are pre-launch steps)
- **P2 important:** Storage policy verification
- **P3 cleanup:** Consider down migrations for future major versions
