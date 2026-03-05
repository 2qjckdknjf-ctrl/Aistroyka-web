# MCP Supabase smoke check

**Timestamp:** 20260303192015  
**Date:** 2026-03-03

---

## STEP 0 — Auth

- **mcp_auth:** Not invoked (MCP responded to list_projects and execute_sql; session already authenticated).
- **Connected account:** Supabase projects listed; production project selected as below.

---

## STEP 1 — Project

| Field | Value |
|-------|--------|
| **Project ref** | **vthfrxehrursfloevnlp** |
| **Name** | AISTROYKA |
| **Status** | ACTIVE_HEALTHY |
| **Region** | eu-central-1 |

**Confirmation:** Project ref matches expected production **vthfrxehrursfloevnlp (AISTROYKA)** ✓

---

## STEP 2 — Live smoke check (read-only)

### A) Tables in public with RLS disabled

**Query:** List tables in schema public where relrowsecurity = false.

**Result:** `[]` (no rows)

**Summary:** No tables in public have RLS disabled. All public tables have RLS enabled.

---

### B) SELECT privileges on admin/observability views (anon, authenticated)

**Views checked (25):**  
failure_metrics, sla_breaches, tenant_usage_summary, tenant_hourly_usage, job_trace, worker_metrics, monthly_churn, active_tenants, plan_monthly_revenue, worker_status, active_analysis_jobs, tenant_monthly_usage, sla_metrics, tenant_active_jobs, dead_letter_jobs, monthly_margin, tenant_dynamic_pricing, monthly_revenue, queue_latency, arpu, job_metrics, job_throughput, failure_trend, job_durations, monthly_ai_cost.

**Result:** For every view: `anon_select: false`, `authenticated_select: false`.

**Summary:** No anon or authenticated SELECT on any of the listed admin/observability views.

---

### C) SECURITY DEFINER functions — EXECUTE for anon/authenticated

**Result:** 22 function signatures (including overloads). For every row: `anon_execute: false`, `authenticated_execute: false`.

**Functions covered:** check_tenant_quota, claim_job_execution, complete_analysis_job (2), create_analysis_job, dequeue_job (3), generate_monthly_invoice, increment_worker_processed, issue_invoice, mark_invoice_paid, mark_overdue_invoices, mark_stale_jobs_failed, pick_next_analysis_job (2), process_stripe_payment, reassign_queued_jobs_from_inactive_regions, record_job_event, recover_dead_workers, retry_job, worker_heartbeat.

**Summary:** No anon or authenticated EXECUTE on any SECURITY DEFINER function in public.

---

## STEP 3 — PASS/FAIL

| Check | Result |
|-------|--------|
| No anon/authenticated SELECT on admin views | **PASS** |
| No anon/authenticated EXECUTE on definer functions | **PASS** |
| No public tables with RLS disabled | **PASS** |

**Overall:** **PASS** — Production Supabase security posture matches hardened state.

---

*End of smoke report.*
