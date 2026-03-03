# Security plan — live hardening

**Date:** 2026-03-03  
**Prerequisite:** Worker credentials fix applied (process route uses getAdminClient(); SUPABASE_SERVICE_ROLE_KEY required for job processing).

---

## Diff: offline expected vs live (assumed)

Live DB was not queried (MCP auth timed out). Assumptions from offline bundle:

| Item | Offline (bundle) | Expected live |
|------|------------------|----------------|
| Admin views | 25+ in public | Same; default Supabase often grants SELECT to anon, authenticated on public objects |
| job_sweep_log | No RLS, no explicit revoke | RLS off; anon/authenticated likely have table privileges |
| SECURITY DEFINER functions | Many in public | anon/authenticated may have EXECUTE by default |

After running discovery (Step 1) via MCP or manual SQL, replace this section with actual snapshot paths (e.g. view_grants.<ts>.json).

---

## What will change when we run docs/audit/supabase-security-fixes.sql

1. **Views:** REVOKE SELECT on 25 admin/observability views from anon and authenticated. service_role keeps SELECT (by default or explicit).
2. **job_sweep_log:** ALTER TABLE ENABLE ROW LEVEL SECURITY; REVOKE ALL from anon, authenticated; GRANT SELECT, INSERT to service_role.
3. **Functions:** DO block revokes EXECUTE on all SECURITY DEFINER functions in schema public from anon and authenticated. service_role keeps EXECUTE.

---

## Risk notes

| Risk | Mitigation |
|------|------------|
| Job processing breaks | Process route now uses getAdminClient(); set SUPABASE_SERVICE_ROLE_KEY in env before applying revokes. |
| Cron mark_stale_jobs_failed | Runs as postgres; not affected by revokes. |
| Dashboard/admin tools | Must use service_role or backend with service key; no anon/authenticated SELECT on admin views. |
| Missing view/function in script | DO block revokes all definer functions in public; view list is explicit — add any new admin view to the fix script. |

---

## Rollback

If something breaks after apply:

1. **Re-grant SELECT on views:**  
   `GRANT SELECT ON public.<view_name> TO anon, authenticated;` for each view (use list from supabase-security-fixes.sql).
2. **job_sweep_log:**  
   `ALTER TABLE public.job_sweep_log DISABLE ROW LEVEL SECURITY;`  
   `GRANT ALL ON public.job_sweep_log TO anon, authenticated;`  
   (Only if you must temporarily restore client access; not recommended.)
3. **Re-grant EXECUTE on functions:**  
   For each SECURITY DEFINER function that must be callable by anon/authenticated (e.g. for a legacy worker):  
   `GRANT EXECUTE ON FUNCTION public.<name>(<args>) TO anon, authenticated;`  
   Prefer fixing the client to use service_role instead of rollback.

---

## Decision

- **Apply fixes:** Safe to run once SUPABASE_SERVICE_ROLE_KEY is set and the process route is deployed (code change already in place).
- **No changes needed:** Only if a live snapshot shows that all admin views already have no SELECT for anon/authenticated, job_sweep_log already has RLS and revoked, and no definer function has EXECUTE for anon/authenticated. Then proceed to Step 5 validation only.
