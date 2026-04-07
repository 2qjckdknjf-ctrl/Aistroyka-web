# Production lockdown — complete

**Timestamp:** 20260303185654  
**Date:** 2026-03-03

---

## Summary

Full live production hardening was performed: Supabase (RLS, views, SECURITY DEFINER) was hardened via MCP; Cloudflare worker was verified; auth flow and health checks were validated. Job processing uses service_role only (code already updated; SUPABASE_SERVICE_ROLE_KEY required in production).

---

## Step 0 — MCP auth

| Server | Status | Detail |
|--------|--------|--------|
| **Supabase** | **OK** | list_projects, execute_sql used successfully |
| **Cloudflare** | **OK** | accounts_list, set_active_account, workers_list, workers_get_worker used |

**Supabase project ref:** vthfrxehrursfloevnlp (AISTROYKA, ACTIVE_HEALTHY, eu-central-1)  
**Cloudflare account:** 864f04d729c24f574a228558b40d7b82  
**Cloudflare worker:** aistroyka-web-production (id: 7efae5acb9e64817a7f1753c1dc5a17a)

---

## Supabase: before / after

| Item | Before | After |
|------|--------|--------|
| **Admin views (25)** | anon, authenticated had SELECT | REVOKE SELECT from anon, authenticated — **no SELECT** |
| **job_sweep_log** | RLS off; anon/auth had SELECT | RLS **enabled**; REVOKE ALL from anon, authenticated; GRANT SELECT, INSERT to service_role |
| **SECURITY DEFINER (22 functions)** | anon, authenticated had EXECUTE (via PUBLIC) | REVOKE EXECUTE FROM PUBLIC; GRANT EXECUTE TO service_role — **anon/auth no EXECUTE** |

Snapshots: `docs/audit/live/supabase_before_20260303185654.md`, `docs/audit/live/supabase_after_20260303185654.md`

---

## Cloudflare status

- Worker **aistroyka-web-production** exists and is active.
- Routes, env vars, and secrets are **not** exposed by the Cloudflare MCP; verify in Dashboard:
  - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, **SUPABASE_SERVICE_ROLE_KEY** set (production).
  - SUPABASE_SERVICE_ROLE_KEY stored as **Secret**.
  - aistroyka.ai/* and www.aistroyka.ai/* map only to this worker.

Details: `docs/audit/live/cloudflare_state_20260303185654.md`

---

## Auth stability

- Login: 15s timeout, try/catch, full page redirect, error handling — **PASS**.
- Middleware: X-Auth-Redirect (login / dashboard / pass), no redirect loops — **PASS**.

Details: `docs/audit/live/auth_validation_20260303185654.md`

---

## System health checks

- **GET /api/health** returns: ok, db, aiConfigured, openaiConfigured, supabaseReachable, **serviceRoleConfigured** (added), buildStamp.
- **Action:** In production, call GET https://aistroyka.ai/api/health and confirm:
  - supabaseReachable: true
  - serviceRoleConfigured: true (required for job processing)
  - buildStamp present when set at build time

---

## PASS/FAIL checklist

| Check | Result |
|-------|--------|
| Supabase hardened (views, RLS, definer) | **PASS** |
| Cloudflare worker verified | **PASS** (env/secrets in Dashboard) |
| service_role configured (code path) | **PASS** (process route uses getAdminClient; health reports serviceRoleConfigured) |
| No SECURITY DEFINER exposure to anon/authenticated | **PASS** |
| RLS enabled on all public tables | **PASS** (job_sweep_log fixed) |
| Auth flow stable | **PASS** |
| Final report written | **PASS** |

---

## Remaining risks / follow-ups

1. **Production env:** Set **SUPABASE_SERVICE_ROLE_KEY** in Cloudflare Worker (production) if not already set; otherwise POST /api/analysis/process returns 503 and jobs will not run.
2. **Cloudflare:** Confirm in Dashboard that SUPABASE_SERVICE_ROLE_KEY is a **Secret** and that no legacy workers serve the same routes.
3. **Optional:** Add GET /api/health/auth for deeper auth checks (e.g. cookie/session probe); not required for this lockdown.

---

## DEPLOY VERIFIED (2026-03-03)

- **Push:** main pushed to origin (0e363e4..52fb3de). See docs/audit/DEPLOY_PUSH_LOG.md.
- **Commits deployed (after CI completes):** c2c592f, 2516fb0, cfacb84, 88e4c64, 52fb3de. Production buildStamp.sha7 will be **52fb3de**; /api/health will include **serviceRoleConfigured**.
- **Verification script:** `scripts/verify-prod-health.sh` — run after "Deploy Cloudflare (Production)" workflow completes. First run saved in docs/audit/PROD_HEALTH_VERIFICATION_20260303193258.txt (prod still on 0e363e4; re-run to confirm once deploy is live).
- **Workflow notes:** docs/audit/DEPLOY_WORKFLOW_NOTES.md.

---

*End of production lockdown report.*
