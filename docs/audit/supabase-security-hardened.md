# Supabase Security Hardening — Final Report

**Date:** 2026-03-03  
**Prerequisite:** Apply `docs/audit/supabase-security-fixes.sql` in Supabase SQL Editor (or via migration), then re-validate.

---

## Before vs after

| Area | Before | After (once fixes applied) |
|------|--------|----------------------------|
| **Admin/observability views** | anon/authenticated likely had default SELECT | SELECT revoked from anon, authenticated; service_role only |
| **public.job_sweep_log** | No RLS; default table grants to anon/authenticated | RLS enabled; REVOKE ALL from anon, authenticated; GRANT SELECT, INSERT to service_role |
| **SECURITY DEFINER functions** | anon/authenticated may have had EXECUTE | EXECUTE revoked from anon, authenticated (DO block in fix script) |

---

## List of revoked privileges (from fix script)

### Views (SELECT revoked from anon, authenticated)

- active_analysis_jobs, job_metrics, job_durations, queue_latency  
- worker_status, failure_metrics, sla_breaches, sla_metrics, failure_trend, job_throughput  
- tenant_active_jobs, tenant_hourly_usage, tenant_usage_summary, tenant_monthly_usage  
- monthly_revenue, active_tenants, monthly_churn, arpu, plan_monthly_revenue  
- monthly_ai_cost, monthly_margin, tenant_dynamic_pricing  
- dead_letter_jobs, job_trace, worker_metrics  

### Table job_sweep_log

- REVOKE ALL from anon, authenticated  
- GRANT SELECT, INSERT to service_role  
- RLS enabled, no per-role policies (access only via service_role or definer)

### Functions

- All SECURITY DEFINER functions in schema `public`: EXECUTE revoked from anon, authenticated (via DO block).

---

## RLS changes applied

| Object | Change |
|--------|--------|
| public.job_sweep_log | ENABLE ROW LEVEL SECURITY; no policies (deny all via RLS; service_role and definer bypass). |

---

## Final risk rating (after applying fixes)

| Item | Status |
|------|--------|
| SECURITY DEFINER views exposed to anon/authenticated | **Mitigated** — no SELECT for anon/authenticated on admin views |
| All public tables have RLS | **Yes** — job_sweep_log now has RLS |
| Privilege escalation paths | **Mitigated** — definer function EXECUTE revoked from anon/authenticated |

---

## Views that still exist (and are admin-only)

These views remain for **service_role** (dashboard, backend, cron). They are not recreated without SECURITY DEFINER; they simply have restricted SELECT:

- All observability views listed in the scan (job_metrics, job_durations, queue_latency, worker_status, failure_*, sla_*, job_throughput, tenant_*, monthly_*, dead_letter_jobs, job_trace, worker_metrics).

No view **requires** SECURITY DEFINER; Postgres views run with owner privileges. Restricting SELECT to service_role is sufficient.

---

## Validation checklist (run after applying fixes)

1. **Anon**
   - `SET ROLE anon; SELECT * FROM public.job_metrics;` → expected: permission denied (or empty if RLS policy existed).
   - `SELECT * FROM public.job_sweep_log;` → permission denied.
2. **Authenticated**
   - Same as anon for admin views and job_sweep_log.
3. **service_role**
   - Can SELECT from admin views and job_sweep_log; can INSERT into job_sweep_log (via definer or direct).
4. **Cron / mark_stale_jobs_failed**
   - Still runs as superuser or postgres; INSERT into job_sweep_log succeeds.

---

## Worker access (anon key)

If workers currently use the **anon** key to call `dequeue_job`, `increment_worker_processed`, or `worker_heartbeat`, revoking EXECUTE will break them. Options:

- **Preferred:** Use **service_role** (or a dedicated worker role) for workers; keep EXECUTE revoked from anon/authenticated.
- **Otherwise:** Grant EXECUTE on only the required functions to a dedicated `worker` role and have workers use that role’s key.

---

## Stop condition (all met once fixes are applied and validated)

- No admin view is exposed to anon/authenticated (SELECT revoked).  
- All public tables have RLS enabled (including job_sweep_log).  
- No privilege escalation: anon/authenticated cannot execute SECURITY DEFINER functions (unless you re-grant for a specific worker role).  
- This report and the scan report are written.
