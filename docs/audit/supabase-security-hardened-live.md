# Supabase security hardening — live audit report

**Date:** 2026-03-03  
**Project ref (prod):** *Not confirmed — MCP auth timed out; no live DB access.*

---

## Status: BLOCKED (MCP auth)

Live validation and apply were **not** performed because:

- **Step 0 (MCP auth):** Authentication for server `plugin-supabase-supabase` timed out after 2 minutes. No project ref was confirmed; no live queries or writes were executed.

---

## What was completed

| Step | Result |
|------|--------|
| 0 — MCP auth | **Failed** (timeout) |
| 1 — Live snapshot | Skipped (no DB access) |
| 2 — Worker credentials | **Done.** Assessment in `docs/audit/live/WORKER_CREDENTIALS_ASSESSMENT.20260303.md`. **Code change:** `POST /api/analysis/process` now uses **getAdminClient()** for processOneJob; returns 503 if SUPABASE_SERVICE_ROLE_KEY is not set. |
| 3 — Plan | **Done.** `docs/audit/live/SECURITY_PLAN.20260303.md` (diff, impact, rollback). |
| 4 — Apply | **Not run** (no MCP; script can be run manually in Supabase SQL Editor). |
| 5 — Validation | **Not run** (manual SQL in `docs/audit/live/MANUAL_SNAPSHOT_AND_VALIDATION.sql`). |
| 6 — Final report | This file. |

---

## Before / after summary

| Area | Before (offline) | After (when you apply manually) |
|------|------------------|----------------------------------|
| Admin views | anon/authenticated likely have SELECT | REVOKE SELECT from anon, authenticated |
| job_sweep_log | No RLS; default grants | RLS on; REVOKE ALL from anon, authenticated; GRANT to service_role |
| SECURITY DEFINER functions | anon/authenticated may have EXECUTE | REVOKE EXECUTE from anon, authenticated |
| Job processor (web) | Used authenticated (server createClient) | Uses service_role (getAdminClient); requires SUPABASE_SERVICE_ROLE_KEY |

---

## How to complete the live audit

1. **Set SUPABASE_SERVICE_ROLE_KEY** in the environment where the web app runs (e.g. Cloudflare Worker / Node), so job processing uses service_role after revokes.
2. **Option A:** Authenticate Supabase MCP and re-run the full workflow (Steps 0–6).
3. **Option B:** Follow **docs/audit/live/LIVE_AUDIT_BLOCKED.md** (manual snapshot → apply script in SQL Editor → after snapshot → validation queries → update this report with project ref and PASS/FAIL).

---

## Follow-ups

- **Confirm production project ref** once MCP or Dashboard is available; record in this file.
- **Optional:** Create a dedicated Postgres **worker** role with minimal EXECUTE grants and use it for job processing instead of service_role for least privilege.
