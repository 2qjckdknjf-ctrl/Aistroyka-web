# Aistroyk Engine Audit Report

**Date:** 2026-02-23  
**Workspace root:** AISTROYKA-WEB  
**Engine location:** Folder `./Aistroyk` was **not found** in the workspace. The audit was performed on the **parent directory** that contains both AISTROYKA-WEB and the engine assets: `src/`, `supabase/migrations/`, `docs/`, and the Vite/worker app (package name `aistroyka`). That parent is the “engine” side of the monorepo.

---

## 1. Repository Structure

- **Repo type:** The workspace is AISTROYKA-WEB (its own git repo). The engine lives in the **parent folder** (AISTROYKA): same filesystem tree, with `src/`, `supabase/`, `docs/`, and a root `package.json` (Vite + worker). There is no separate `./Aistroyk` directory; only one `.git` was found (under AISTROYKA-WEB).
- **Main modules (engine):**
  - **src/** — React/Vite app: `app/`, `ui/`, `data/` (Supabase client, projects, media, jobs, aiAnalysis), `ai/` (analysisService, types, mediaOrchestrator), `worker/analysisWorker.ts` (Node worker: poll job, run AI, complete/fail).
  - **supabase/migrations/** — 30 SQL migrations (from initial schema through multi-tenant, observability, retry, billing, Stripe, etc.).
  - **docs/** — Architecture and design docs (worker, observability, SLA, billing, retry, idempotent execution, etc.).

- **Package managers / entrypoints:**
  - **package.json** (parent): `npm`/Vite; scripts: `dev`, `build`, `worker` (`tsx src/worker/analysisWorker.ts`).
  - **Runtime entrypoints:** `src/main.tsx` (Vite app), `src/worker/analysisWorker.ts` (background worker). No separate Go/Rust/Python/Cargo.

---

## 2. Implemented Features (Evidence)

| Feature | Evidence (file:line or migration) | Short description |
|--------|-----------------------------------|-------------------|
| **Multi-tenant** | `20250223300000_multi_tenant_v1.sql`: `tenants` table; `tenant_id` on `projects`, `media`, `analysis_jobs`, `ai_analysis`. Later migrations use `p_tenant_id`, `tenant_id` in RPCs and views. | Tenants table; all core tables have `tenant_id`; RPCs take `p_tenant_id` for quota and job creation. |
| **Queue semantics** | `20250222800000_pick_next_analysis_job.sql`, `20250224500000_distributed_worker_pool_v1.sql`, `20250224700000_retry_engine_v1.sql`: `for update skip locked` in CTEs. | `pick_next_analysis_job` and `dequeue_job`/retry logic use `FOR UPDATE SKIP LOCKED` for safe concurrent dequeue. |
| **Exactly-once / execution token** | `20250224800000_idempotent_execution_v1.sql`: `execution_token`, `execution_started_at`; `claim_job_execution(job_id, worker_id)`; `complete_analysis_job` requires `execution_token` not null. | Jobs are claimed with a unique `execution_token`; completion and retry/recover clear or set token so only one worker can complete a job. |
| **Retry / DLQ / backoff** | `20250224700000_retry_engine_v1.sql`: `retry_count`, `next_retry_at`, `last_error`, status `'dead'`, `retry_job` RPC, `dead_letter_jobs` view. | Retry with backoff; jobs can move to `dead`; view for dead-letter jobs. |
| **Heartbeat / crash recovery** | `20250224600000_worker_crash_recovery_v1.sql`: `workers` table, `last_heartbeat`, `worker_heartbeat(p_worker_id)`, `recover_dead_workers(p_timeout_seconds)`. `20250224800000`: `last_heartbeat` used to requeue stale jobs and clear `execution_token`. | Workers heartbeat; `recover_dead_workers` requeues jobs whose worker’s heartbeat is stale and marks workers offline. |
| **pg_cron sweep** | `20250222700000_auto_stale_job_sweep.sql`: `create extension if not exists pg_cron`, `mark_stale_jobs_failed`, `cron.schedule('mark_stale_jobs_failed', ...)`. | Scheduled job runs `mark_stale_jobs_failed` (e.g. every 5 min) to fail stuck pending/processing jobs. |
| **Observability** | `20250222900000_observability_layer.sql`, `20250224900000_observability_tracing_v1.sql`: `job_events` table, `record_job_event`; `job_trace`, `worker_metrics` views. `20250223100000_sla_and_trend_monitoring.sql`: `sla_breaches`, `sla_metrics`, `failure_trend`, `job_throughput`. | Job lifecycle events, worker metrics, SLA breach and trend views. |
| **Billing** | `20250223600000_usage_accounting_v1.sql`, `20250223700000_billing_engine_v1.sql`, `20250223800000_overage_engine_v1.sql`, `20250223900000_invoice_lifecycle_v1.sql`, `20250224000000_stripe_integration_v1.sql`, etc. | Usage events, billing snapshots, overage, invoices, Stripe integration. |

---

## 3. Integration Surface for AISTROYKA-WEB

### 3.1 RPC catalog (engine migrations)

| RPC / function | Args | Output / behavior | Used by Web? |
|----------------|------|-------------------|--------------|
| **complete_analysis_job** | p_job_id, p_stage, p_completion_percent, p_risk_level, p_detected_issues, p_recommendations, p_frame_count | void | Worker only |
| **pick_next_analysis_job** | — | table(id, media_id, type, file_url, project_id) | Worker (older flow) |
| **dequeue_job** | — | analysis_jobs row | Worker |
| **create_analysis_job** | p_tenant_id, p_media_id, p_priority | analysis_jobs row | **No** — Web does not call (Web has no tenant_id in hand) |
| **trigger_analysis** | p_job_id | — | **Web calls it** — **RPC not present in engine migrations** (missing) |
| **create_project** | — | — | **Not defined** — Web uses direct `projects.insert({ name, user_id })`. |
| **record_job_event** | p_job_id, p_worker_id, p_event_type, p_payload | — | Worker |
| **worker_heartbeat** | p_worker_id | — | Worker |
| **recover_dead_workers** | p_timeout_seconds | — | Cron / admin |
| **retry_job** | job_id, error, max_retries | — | Admin / recovery |
| **check_tenant_quota** | p_tenant_id | — | Used by create_analysis_job |

### 3.2 Tables / views used by Web (from Web code and types)

- **projects** — Web inserts `name`, `user_id`; selects by `user_id`. Engine schema has `tenant_id`, **no `user_id`** in initial/multi_tenant migrations.
- **media** — Web uploads and lists by project; engine has `media` with `project_id`, `tenant_id`, `type`, `file_url`.
- **analysis_jobs** (or jobs) — Web lists jobs, triggers analysis; engine has `analysis_jobs` with `tenant_id`, `media_id`, `status`, etc.
- **ai_analysis** — Results; engine has `ai_analysis` with `job_id`, `media_id`, stage, completion_percent, risk_level, etc.

### 3.3 Storage upload

- Engine/docs: bucket **media** for image/video. Web uses Supabase Storage (e.g. `lib/storage.ts`, upload route) and stores path/URL in `media`. No separate “signed URL” RPC found in migrations; upload is likely direct to Storage + insert into `media`.

### 3.4 Auth / RLS

- Migrations: RLS enabled on projects, analyses, media, ai_analysis, analysis_jobs, job_events, etc., with policies like “Allow all for X” (permissive for MVP). No `auth.uid()` in migrations; engine is tenant_id–based. Web uses `auth.getUser()` and `user_id` on projects for ownership; **engine has no `user_id` on projects**, so Web and engine schemas diverge.

### 3.5 Proposed integration map (Web action → backend)

| Web action | Current Web behavior | Engine RPC/table | Required args | Expected output | Status |
|------------|------------------------|------------------|---------------|-----------------|--------|
| List projects | Select from `projects` where `user_id = auth.uid()` | `projects` | — | rows | **Gap:** engine has `tenant_id`, no `user_id`. |
| Create project | Insert `projects` with `name`, `user_id` | No RPC; direct insert | name, user_id | id | **Gap:** engine schema has no `user_id`. |
| Upload media | Storage upload + insert `media` | `media` insert | project_id, path/url, type | id | Plausible if `media` has project_id and engine allows insert. |
| Trigger analysis | `supabase.rpc('trigger_analysis', { p_job_id })` | **Missing** | p_job_id | void/ok | **Missing RPC.** |
| Poll job status | Select job (and ai_analysis) by id | `analysis_jobs`, `ai_analysis` | job_id | status, result | OK if Web queries same tables. |
| Fetch results | Select ai_analysis for job/project | `ai_analysis` | job_id or project | rows | OK. |
| Billing status | — | billing snapshots, usage_events | tenant_id | — | Not used by Web MVP. |
| Admin job monitor | — | job_events, worker_metrics, dead_letter_jobs, sla_* | — | — | Available in DB; no Web UI yet. |

---

## 4. Gaps / Missing Pieces for Web MVP

1. **trigger_analysis(p_job_id)** — Web calls it; **not defined in engine migrations.** Either add this RPC (e.g. no-op or “set to queued” so worker can pick) or change Web to stop calling it.
2. **projects.user_id** — Web inserts and filters by `user_id`. Engine has **tenant_id** only. Need either: add `user_id` to `projects` in engine and optionally map user → tenant, or introduce a user↔tenant mapping and have Web pass tenant_id.
3. **create_project** — Web does direct insert. If RLS or schema require tenant_id, need an RPC or policy that sets tenant_id (e.g. from default tenant or from user→tenant lookup).
4. **Storage / upload** — Confirm bucket name and RLS for Storage match Web (e.g. `media` bucket, policies for authenticated upload). No signed-URL RPC found; direct upload is the assumed flow.
5. **Job creation** — Engine uses **create_analysis_job(p_tenant_id, p_media_id, p_priority)**. Web does not call it (no tenant_id). Web likely creates jobs by another path (e.g. insert into `analysis_jobs` or a simpler RPC). Need a single contract: either Web gets tenant_id (e.g. from project) and calls create_analysis_job, or engine exposes a simpler “create job for this media” that infers tenant from project/media.
6. **Admin monitor** — Observability (job_events, worker_metrics, SLA, dead_letter) exists in DB; no Web UI or API for it yet.

---

## 5. Recommended Next Steps

1. **Staging integration first**
   - Add **trigger_analysis(p_job_id)** in engine: e.g. no-op or “ensure job is queued” so existing workers can pick it; or document that Web must not call it and workers only poll.
   - Align **projects** with Web: add **user_id** to `projects` in engine (and keep tenant_id for billing/quota), or introduce user→tenant and have Web use tenant_id.
   - Ensure one path for **job creation**: either Web calls **create_analysis_job(tenant_id, media_id)** (tenant from project) or add a wrapper RPC that takes project_id/media_id and resolves tenant.
   - Run engine migrations (including multi_tenant, retry, observability) on a **staging** Supabase project; point AISTROYKA-WEB staging env to that DB and Storage.
   - Verify: create project, upload media, create/trigger job, poll status, read ai_analysis.

2. **Production**
   - After staging works: same schema and RPCs on production Supabase; restrict RLS to authenticated users / tenant isolation (replace “Allow all” where appropriate).
   - Configure workers (or serverless) to run analysisWorker (or equivalent) against production DB; ensure heartbeat, recover_dead_workers, and pg_cron sweep are enabled.
   - Optionally add a minimal admin API or dashboard that reads job_events, worker_metrics, dead_letter_jobs.

3. **Place engine under workspace (optional)**
   - If you want a single repo with `./Aistroyk` (or `./engine`): copy or symlink the parent’s `src/`, `supabase/`, and root `package.json` into `./Aistroyk` (or similar) under AISTROYKA-WEB so all paths and reports refer to one tree.

4. **Document contract**
   - One doc listing: RPCs and args the Web relies on, tables/columns Web reads/writes, and Storage bucket/policies. Keeps Web and engine in sync.

5. **No code changes in this audit**
   - As requested, no code was modified; this report is audit-only.

---

*End of report. File: aistroyk-engine-audit-report.md (workspace root: AISTROYKA-WEB).*
