-- =============================================================================
-- Manual snapshot and validation for Supabase security hardening
-- Run in Supabase SQL Editor. Save results to docs/audit/live/*.json or .md
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A) Views in public + owner (Postgres views don't have SECURITY DEFINER;
--    they run with owner privileges when selected.)
-- -----------------------------------------------------------------------------
SELECT
  c.relname AS view_name,
  pg_get_userbyid(c.relowner) AS owner,
  pg_catalog.obj_description(c.oid, 'pg_class') AS comment
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'v'
ORDER BY c.relname;

-- -----------------------------------------------------------------------------
-- B) Grants on admin/observability views for anon, authenticated, service_role
--    (has_table_privilege works for views as well as tables)
-- -----------------------------------------------------------------------------
SELECT
  c.relname AS view_name,
  has_table_privilege('anon', c.oid, 'SELECT') AS anon_select,
  has_table_privilege('authenticated', c.oid, 'SELECT') AS authenticated_select,
  has_table_privilege('service_role', c.oid, 'SELECT') AS service_role_select
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'v'
ORDER BY c.relname;

-- -----------------------------------------------------------------------------
-- C) Tables in public with RLS disabled (relrowsecurity = false)
-- -----------------------------------------------------------------------------
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND NOT c.relrowsecurity
ORDER BY c.relname;

-- Specifically job_sweep_log
SELECT
  relname,
  relrowsecurity AS rls_enabled,
  relacl AS acl
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'job_sweep_log';

-- -----------------------------------------------------------------------------
-- D) SECURITY DEFINER functions in public + EXECUTE for anon, authenticated, service_role
-- -----------------------------------------------------------------------------
SELECT
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS args,
  p.prosecdef AS security_definer,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef
ORDER BY p.proname, args;

-- -----------------------------------------------------------------------------
-- E) Validation (run AFTER applying fixes) — expect anon/authenticated to have no SELECT on views and no EXECUTE on definer funcs
-- -----------------------------------------------------------------------------
-- E1: Admin views — anon and authenticated should have no SELECT (after fix)
SELECT
  c.relname,
  has_table_privilege('anon', c.oid, 'SELECT') AS anon_select,
  has_table_privilege('authenticated', c.oid, 'SELECT') AS authenticated_select
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'v'
  AND c.relname IN ('job_metrics', 'job_durations', 'queue_latency', 'worker_status')
ORDER BY c.relname;
-- job_sweep_log is a table (not a view); check SELECT for anon/authenticated
SELECT
  c.relname AS table_name,
  has_table_privilege('anon', c.oid, 'SELECT') AS anon_select,
  has_table_privilege('authenticated', c.oid, 'SELECT') AS authenticated_select
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = 'job_sweep_log';

-- E2: Definer functions — anon and authenticated should have no EXECUTE
SELECT
  p.proname,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_exec,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prosecdef
ORDER BY p.proname;

-- E3: job_sweep_log RLS enabled
SELECT relname, relrowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'job_sweep_log';
