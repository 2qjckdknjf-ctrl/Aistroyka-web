# Supabase Security Scan — Discovery Report

**Date:** 2026-03-03  
**Scope:** `public` schema — SECURITY DEFINER patterns, views, RLS, and privileges  
**Method:** Codebase analysis (migrations bundle). Live MCP discovery was not run (MCP auth skipped).

---

## Step 0 — Authentication

- **Status:** MCP authentication was **skipped** by user.
- **Impact:** No live project ref, no runtime privileges or view definitions from the database. This report is derived from `apps/web/scripts/supabase-migrations-bundle.sql` only.
- **Recommendation:** Authenticate the Supabase MCP server and re-run discovery to confirm actual grants and view definitions in production.

---

## Step 1 — Discovery (from migrations)

### 1.1 Views in schema `public`

All views below are **regular views** (PostgreSQL does not have “SECURITY DEFINER” on views; they run with the **view owner’s** privileges on underlying tables, so they can expose more data than the current role would see via RLS).

| View | Underlying objects | Risk if anon/authenticated have SELECT |
|------|--------------------|----------------------------------------|
| `active_analysis_jobs` | analysis_jobs | HIGH — job queue visibility |
| `job_metrics` | analysis_jobs | HIGH — aggregate job counts |
| `job_durations` | analysis_jobs | HIGH — per-job timing |
| `queue_latency` | analysis_jobs | HIGH — latency data |
| `worker_status` | worker_heartbeat | HIGH — worker topology |
| `failure_metrics` | analysis_jobs | HIGH — failure breakdown |
| `failure_trend` | analysis_jobs | HIGH — failure trends |
| `job_throughput` | analysis_jobs | HIGH — throughput |
| `sla_breaches` | analysis_jobs, media | HIGH — SLA breaches |
| `sla_metrics` | analysis_jobs, media | HIGH — SLA metrics |
| `tenant_active_jobs` | analysis_jobs (tenant) | HIGH — tenant queue |
| `tenant_hourly_usage` | usage_events | HIGH — usage by hour |
| `tenant_usage_summary` | usage_events | HIGH — usage summary |
| `tenant_monthly_usage` | usage_events, etc. | HIGH — monthly usage |
| `dead_letter_jobs` | analysis_jobs | HIGH — dead-letter queue |
| `job_trace` | job_events | HIGH — job lifecycle |
| `worker_metrics` | job_events | HIGH — worker metrics |
| `monthly_revenue` | billing_snapshots | HIGH — revenue |
| `active_tenants` | tenants, usage | HIGH — tenant list |
| `monthly_churn` | billing_snapshots | HIGH — churn |
| `arpu` | billing_snapshots | HIGH — ARPU |
| `plan_monthly_revenue` | billing_snapshots, plans | HIGH — revenue by plan |
| `monthly_ai_cost` | ai_cost_events | HIGH — AI cost |
| `monthly_margin` | revenue/cost views | HIGH — margin |
| `tenant_dynamic_pricing` | pricing_rules, usage | HIGH — pricing |
| `job_throughput` | analysis_jobs | HIGH — throughput |

**Assumption:** In a typical Supabase project, `anon` and `authenticated` get default `SELECT` on objects in `public`. So all of the above are treated as **HIGH RISK** if those roles have `SELECT`.

### 1.2 SECURITY DEFINER functions (from migrations)

These functions run with definer (owner) privileges. If `anon` or `authenticated` have `EXECUTE`, they can escalate privileges.

| Function | Purpose | Risk if anon/authenticated have EXECUTE |
|----------|---------|------------------------------------------|
| `complete_analysis_job(...)` | Mark job completed, write ai_analysis, usage_events | **CRITICAL** |
| `mark_stale_jobs_failed(integer)` | Mark jobs failed, insert into job_sweep_log | **CRITICAL** |
| `pick_next_analysis_job()` | Dequeue and lock job | **CRITICAL** |
| `increment_worker_processed(text)` | Update worker_heartbeat | HIGH |
| `create_analysis_job(...)` | Create job | HIGH |
| `dequeue_job(...)` | Dequeue job | HIGH |
| `claim_job_execution(uuid,uuid)` | Claim job execution | HIGH |
| `retry_job(...)` | Retry / dead-letter job | HIGH |
| `recover_dead_workers(integer)` | Requeue stuck jobs | HIGH |
| `record_job_event(...)` | Insert job_events | MEDIUM |
| `worker_heartbeat(uuid)` | Worker heartbeat | MEDIUM |
| (others in bundle) | Billing, invoice, Stripe, etc. | Varies |

**Recommendation:** Revoke `EXECUTE` on all SECURITY DEFINER functions from `anon` and `authenticated` unless a specific role must call them (e.g. worker using anon key); then grant only that role.

### 1.3 Tables in `public` — RLS status

From the migrations bundle, **every created table has RLS enabled except one:**

| Table | RLS in migrations | Notes |
|-------|--------------------|--------|
| `job_sweep_log` | **NOT enabled** | No `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` |
| projects, analyses, media, ai_analysis, analysis_jobs | Enabled | Policies present |
| worker_heartbeat | Enabled | Policy "Allow all for worker_heartbeat" |
| tenants, usage_events, plans, billing_snapshots, payments | Enabled | (policies in bundle) |
| ai_cost_events, pricing_rules, system_capacity | Enabled | |
| workers, job_events, regions, region_capacity | Enabled | |
| tenant_members, tenant_invitations | Enabled | |

**Conclusion:** `public.job_sweep_log` is the only table in the bundle **without RLS** → **HIGH RISK**.

### 1.4 Table: `public.job_sweep_log`

- **Definition (from bundle):**
  - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
  - `executed_at timestamptz NOT NULL DEFAULT now()`
  - `affected_rows integer NOT NULL`
- **RLS:** None in migrations.
- **Grants:** No explicit `GRANT`/`REVOKE` in the bundle; default Supabase behavior typically grants `SELECT, INSERT, UPDATE, DELETE` to `anon` and `authenticated` on `public` tables.
- **Policies:** None (RLS not enabled).
- **Who writes:** Only `mark_stale_jobs_failed()` (SECURITY DEFINER, called by pg_cron).
- **Risk:** **HIGH** — operational log exposed to anon/authenticated if default grants apply.

---

## Step 2 — Security policy (decision logic)

| Rule | Application |
|------|-------------|
| **A** | Any view or function that is admin/analytics-only and is accessible by anon or authenticated → **HIGH RISK** → revoke that access. |
| **B** | Analytics/admin views → remove `SELECT` from anon and authenticated; keep service_role only. |
| **C** | Views do not need SECURITY DEFINER; they run as owner. Prefer not to grant anon/authenticated `SELECT` on admin views. No view “recreation” required if we only revoke. |
| **D** | `public.job_sweep_log`: enable RLS; revoke all from anon and authenticated; no client access required → only service_role (and definer functions) need access. |

---

## Risk summary (from codebase)

| Object type | Count | Risk |
|-------------|--------|------|
| Admin/observability views | 25+ | **HIGH** if anon/authenticated have SELECT |
| SECURITY DEFINER functions | 15+ | **CRITICAL/HIGH** if anon/authenticated have EXECUTE |
| Table without RLS | 1 (`job_sweep_log`) | **HIGH** |

---

## Next steps

1. **Authenticate MCP** and re-run discovery to list actual `GRANT`s and view definitions in production.
2. **Apply fixes** from `docs/audit/supabase-security-fixes.sql` (revokes + RLS on `job_sweep_log`).
3. **Re-scan** after changes and document in `docs/audit/supabase-security-hardened.md`.

No changes have been applied to the database in this step (read-only / codebase-only).
