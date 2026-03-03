-- =============================================================================
-- Supabase Security Hardening — Apply after review
-- Run in Supabase SQL Editor (Dashboard → SQL Editor) or via migration.
-- Idempotent: safe to run multiple times.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Revoke SELECT on admin/observability views from anon and authenticated
--    (Keep service_role; dashboard/backend use service_role.)
-- -----------------------------------------------------------------------------
REVOKE SELECT ON public.active_analysis_jobs FROM anon, authenticated;
REVOKE SELECT ON public.job_metrics FROM anon, authenticated;
REVOKE SELECT ON public.job_durations FROM anon, authenticated;
REVOKE SELECT ON public.queue_latency FROM anon, authenticated;
REVOKE SELECT ON public.worker_status FROM anon, authenticated;
REVOKE SELECT ON public.failure_metrics FROM anon, authenticated;
REVOKE SELECT ON public.sla_breaches FROM anon, authenticated;
REVOKE SELECT ON public.sla_metrics FROM anon, authenticated;
REVOKE SELECT ON public.failure_trend FROM anon, authenticated;
REVOKE SELECT ON public.job_throughput FROM anon, authenticated;
REVOKE SELECT ON public.tenant_active_jobs FROM anon, authenticated;
REVOKE SELECT ON public.tenant_hourly_usage FROM anon, authenticated;
REVOKE SELECT ON public.tenant_usage_summary FROM anon, authenticated;
REVOKE SELECT ON public.tenant_monthly_usage FROM anon, authenticated;
REVOKE SELECT ON public.monthly_revenue FROM anon, authenticated;
REVOKE SELECT ON public.active_tenants FROM anon, authenticated;
REVOKE SELECT ON public.monthly_churn FROM anon, authenticated;
REVOKE SELECT ON public.arpu FROM anon, authenticated;
REVOKE SELECT ON public.plan_monthly_revenue FROM anon, authenticated;
REVOKE SELECT ON public.monthly_ai_cost FROM anon, authenticated;
REVOKE SELECT ON public.monthly_margin FROM anon, authenticated;
REVOKE SELECT ON public.tenant_dynamic_pricing FROM anon, authenticated;
REVOKE SELECT ON public.dead_letter_jobs FROM anon, authenticated;
REVOKE SELECT ON public.job_trace FROM anon, authenticated;
REVOKE SELECT ON public.worker_metrics FROM anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. job_sweep_log: enable RLS, revoke all from anon and authenticated
--    Only pg_cron (runs as superuser/postgres) and mark_stale_jobs_failed()
--    (SECURITY DEFINER) need to write; no client SELECT required.
-- -----------------------------------------------------------------------------
ALTER TABLE public.job_sweep_log ENABLE ROW LEVEL SECURITY;

-- No policy: no role can read/insert/update/delete via RLS.
-- service_role bypasses RLS. SECURITY DEFINER functions run as owner and bypass RLS.
REVOKE ALL ON public.job_sweep_log FROM anon, authenticated;

-- Ensure only service_role (and definer) can use the table
GRANT SELECT, INSERT ON public.job_sweep_log TO service_role;

-- -----------------------------------------------------------------------------
-- 3. SECURITY DEFINER functions: revoke EXECUTE from anon and authenticated
--    Workers that use anon key for dequeue/heartbeat must be reverted to
--    service_role or a dedicated role; otherwise add back EXECUTE for that role only.
-- -----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.mark_stale_jobs_failed(integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.complete_analysis_job(uuid, text, integer, text, text[], text[], integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pick_next_analysis_job() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_worker_processed(text) FROM anon, authenticated;

-- If your bundle has overloads, run for each signature, e.g.:
-- REVOKE EXECUTE ON FUNCTION public.complete_analysis_job(...) FROM anon, authenticated;
-- REVOKE EXECUTE ON FUNCTION public.create_analysis_job(...) FROM anon, authenticated;
-- REVOKE EXECUTE ON FUNCTION public.dequeue_job(...) FROM anon, authenticated;
-- REVOKE EXECUTE ON FUNCTION public.claim_job_execution(uuid, uuid) FROM anon, authenticated;
-- REVOKE EXECUTE ON FUNCTION public.retry_job(uuid, text, integer) FROM anon, authenticated;
-- REVOKE EXECUTE ON FUNCTION public.recover_dead_workers(integer) FROM anon, authenticated;
-- REVOKE EXECUTE ON FUNCTION public.record_job_event(uuid, uuid, text, jsonb) FROM anon, authenticated;

-- List all SECURITY DEFINER functions in public and revoke from anon/authenticated:
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM anon, authenticated',
      r.proname, r.args
    );
  END LOOP;
END;
$$;
