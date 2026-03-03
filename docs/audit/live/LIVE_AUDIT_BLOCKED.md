# Live Supabase security audit — BLOCKED (MCP auth)

**Date:** 2026-03-03  
**Status:** Step 0 (MCP auth) failed — authentication timed out after 2 minutes. No live DB access was available.

---

## What was done without MCP

1. **Worker credentials assessment** — `docs/audit/live/WORKER_CREDENTIALS_ASSESSMENT.20260303.md`
   - Confirmed `POST /api/analysis/process` uses **authenticated** (anon key + session) for dequeue_job, claim_job_execution, complete_analysis_job.
   - **Code change applied:** Process route now uses **getAdminClient()** (service_role) for processOneJob; returns 503 if SUPABASE_SERVICE_ROLE_KEY is not set. This allows applying the security fix script without breaking job processing once the key is set.

2. **Security plan** — `docs/audit/live/SECURITY_PLAN.20260303.md`  
   - Diff (offline vs expected live), impact, rollback, and prerequisite (use admin client; done).

3. **Manual SQL runbook** — `docs/audit/live/MANUAL_SNAPSHOT_AND_VALIDATION.sql`  
   - Queries to run in Supabase SQL Editor to produce before/after snapshots and validation when MCP is not available.

---

## How to complete the live audit (after MCP auth or manually)

### Option A: Authenticate MCP and re-run

1. In Cursor, trigger MCP auth for **plugin-supabase-supabase** (e.g. invoke `mcp_auth` with `{}` and complete the browser/login flow within the timeout).
2. Re-run this workflow: Step 0 → Step 1 (live snapshot) → Step 3 (plan) → Step 4 (apply fixes) → Step 5 (validation) → Step 6 (final report). Use the same agent instructions; the MCP server may expose tools such as `execute_sql` or `run_sql` after auth to run the snapshot/validation queries and apply script.

### Option B: Manual execution in Supabase Dashboard

1. **Confirm project:** Dashboard → Project Settings → General → Reference ID (production).
2. **Before snapshot:** Run the queries in `docs/audit/live/MANUAL_SNAPSHOT_AND_VALIDATION.sql` (Section A: views, B: view grants, C: RLS tables, D: definer functions). Save outputs to `docs/audit/live/views.<ts>.json`, `view_grants.<ts>.json`, `rls_tables.<ts>.json`, `definer_functions.<ts>.json`, and a summary in `SECURITY_SNAPSHOT.<ts>.md`.
3. **Prerequisite:** Ensure `SUPABASE_SERVICE_ROLE_KEY` is set where the web app runs (see WORKER_CREDENTIALS_ASSESSMENT). The process route now uses it for job RPCs.
4. **Apply fixes:** In SQL Editor, run `docs/audit/supabase-security-fixes.sql` in full. Save the execution log to `docs/audit/live/APPLY_LOG.<ts>.txt`.
5. **After snapshot:** Re-run the same snapshot queries; save as `views.after.<ts>.json`, etc.
6. **Validation:** Run Section E of `MANUAL_SNAPSHOT_AND_VALIDATION.sql` (anon/authenticated checks). Record results in `docs/audit/live/VALIDATION_REPORT.<ts>.md`.
7. **Final report:** Update `docs/audit/supabase-security-hardened-live.md` with project ref, before/after, validation PASS/FAIL.

---

## Stop condition (not yet met)

- [ ] MCP authenticated and project ref confirmed  
- [ ] Live before/after snapshots exist  
- [ ] Fixes applied safely OR explicitly skipped with reason  
- [ ] Validation PASS for all critical checks  
- [x] Final live report written (see supabase-security-hardened-live.md)
