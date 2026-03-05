# Database Architecture

**Source:** apps/web/supabase/migrations (35+ SQL files).  
**DB:** Supabase (PostgreSQL).

---

## 1. Tables (from migrations)

Migrations reference `public.tenants` and `tenant_members` (e.g. upload_sessions, jobs, sync_cursors reference tenants). CREATE TABLE for **tenants** and **tenant_members** (and **projects**, **media**) is not in the migration set reviewed; they may come from an earlier Supabase setup or seed. The following are created in migrations:

| Table | Migration | Purpose |
|-------|-----------|---------|
| rate_limit_slots | 20260304000000 | Rate limiting by tenant/IP/endpoint |
| ai_usage | 20260304000100 | AI token/cost usage per tenant/user |
| tenant_billing_state | 20260304000100 | Billing state |
| tenants.plan | 20260304000200 | Subscription tier (ALTER) |
| worker_day | 20260304000300 | Worker day start/end |
| worker_reports | 20260304000300 | Reports |
| worker_report_media | 20260304000300 | Report–media link |
| worker_tasks | 20260304000300 | Worker tasks |
| upload_sessions | 20260304000400 | Upload session create/finalize |
| jobs | 20260305000000 | Job queue |
| job_events | 20260305000000 | Job lifecycle events |
| idempotency_keys | 20260305000100 | Idempotent write keys |
| tenant_daily_metrics | 20260305000200 | Daily metrics |
| roles, permissions, role_permissions, user_scopes | 20260306000000 | RBAC |
| project_members, task_assignments | 20260306100000 | Project membership and task assignment |
| organizations, organization_tenants, organization_members | 20260306200000 | Orgs |
| audit_logs, data_retention_policies | 20260306300000 | Audit and retention |
| sync_cursors, change_log | 20260307000000 | Sync engine |
| tenant_concurrency | 20260307200000 | Concurrency limits |
| ai_policy_decisions | 20260307300000 / 074 | AI policy audit |
| jobs (dedupe_key) | 20260307300000 | Dedupe |
| slo_daily, alerts | 20260307400000 / 075 | SLO and alerts |
| tenant_settings | 20260307600000 | Tenant settings |
| feature_flags, tenant_feature_flags | 20260308000000 | Feature flags |
| billing_customers, entitlements | 20260308100000 | Billing |
| identity_providers, sso_sessions | 20260308200000 | SSO |
| ai_provider_health | 20260308300000 | Circuit breaker state |
| events | 20260308400000 | Analytics events |
| experiments, experiment_assignments | 20260308500000 | A/B experiments |
| tenant_data_plane | 20260309000000 | Data plane routing |
| export_batches, export_rows | 20260309100000 | Exports |
| privacy_settings, pii_findings | 20260309200000 | Privacy/PII |
| baselines_daily, anomalies | 20260309300000 | Anomaly detection |
| device_tokens, push_outbox | 20260309400000 | Push |
| photo_annotations, photo_comments | 20260309500000 | Collab |

---

## 2. Relationships

- **Tenant-scoped:** Most tables have `tenant_id` (FK to tenants) and are tenant-isolated.
- **RLS:** Migrations enable RLS and add policies (e.g. upload_sessions_tenant, jobs_tenant, sync_cursors_tenant, change_log_tenant_*) so that rows are visible/writable only when `auth.uid()` is in tenant_members for that tenant_id.
- **Jobs:** claim_jobs RPC for atomic claim; job_events for history.
- **Sync:** sync_cursors (tenant_id, user_id, device_id); change_log (tenant_id, resource_type, resource_id, change_type).

---

## 3. Indexes

- Indexes created in migrations for: tenant_id + user_id, tenant_id + status + run_after (jobs), tenant_id + id (change_log), etc. See individual migration files for full list.

---

## 4. Tenant Isolation

- **Application:** Repositories and services pass tenantId and use `.eq("tenant_id", tenantId)`.
- **Database:** RLS policies enforce tenant via `tenant_id in (select tenant_id from tenant_members where user_id = auth.uid())`. Service-role (admin) client bypasses RLS; application code must pass tenant_id when using admin client.

---

## 5. Missing / Assumed Entities

- **tenants, tenant_members:** Referenced by FKs; CREATE TABLE not in scanned migrations (assumed from Supabase auth/setup).
- **projects, media:** Referenced in code (project.repository, media.repository); tables assumed to exist (possibly earlier migrations or seed).
- **ai_results:** No dedicated “ai_results” table in migrations; AI output is stored in job payloads / media/report linkage as per handlers.

---

## 6. RLS Summary

Migrations enable RLS and add tenant-scoped policies for: upload_sessions, jobs, job_events, sync_cursors, change_log, and others. Admin operations use service-role client and must enforce tenant in application logic.
