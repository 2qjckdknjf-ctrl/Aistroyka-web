# Worker credentials assessment

**Date:** 2026-03-03  
**Purpose:** Identify who calls SECURITY DEFINER job RPCs (dequeue_job, claim_job_execution, complete_analysis_job) and with which key (anon vs service_role) so we do not break production when revoking EXECUTE from anon/authenticated.

---

## Findings

### 1. Job processor: `POST /api/analysis/process`

| Item | Detail |
|------|--------|
| **File** | `apps/web/app/api/analysis/process/route.ts` |
| **Client** | `createClient()` from `@/lib/supabase/server` |
| **Key** | **NEXT_PUBLIC_SUPABASE_ANON_KEY** (server uses same key as browser; session from cookies = **authenticated** role when user logged in) |
| **RPCs used** | `dequeue_job`, `claim_job_execution`, `complete_analysis_job` (via `processOneJob()` in `lib/ai/runOneJob.ts`) |
| **Trigger** | `JobListPolling.tsx`, `UploadMediaForm.tsx` — after upload or poll; requires authenticated user |

**Conclusion:** The web app’s “process one job” flow runs as **authenticated** (anon key + user JWT). If we revoke EXECUTE on these functions from **authenticated**, this route will start getting permission denied and job processing will break.

### 2. Engine worker (separate process)

- **Searched:** `engine/` for `dequeue_job`, `pick_next_analysis_job`, `complete_analysis_job`.
- **Result:** No matches in current engine codebase. TECHNICAL_DOSSIER references `engine/Aistroyk/src/worker/analysisWorker.ts` and `engine/Aistroyk` migrations; no active worker file found under `engine/` in this repo that calls these RPCs.
- **If a standalone worker exists elsewhere:** It must use **service_role** (or a dedicated worker role). Do not rely on anon/authenticated for worker RPCs.

### 3. pg_cron: `mark_stale_jobs_failed`

- Runs inside Postgres as **superuser / postgres**. Does not use anon or authenticated. Revoking EXECUTE from anon/authenticated does not affect cron.

### 4. Other Supabase key usage

| Location | Key | Use |
|----------|-----|-----|
| `lib/supabase/client.ts`, `server.ts`, middleware | NEXT_PUBLIC_SUPABASE_ANON_KEY | Browser and server (with user session) |
| `lib/supabase/admin.ts` | SUPABASE_SERVICE_ROLE_KEY | getAdminClient(); used only for bucket create in upload route |
| Edge functions (docs/status) | SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY | Engine/Deno; service role for most; anon for some fetch with user JWT |

---

## Requirement before applying security fixes

**Before** running `docs/audit/supabase-security-fixes.sql` (which revokes EXECUTE on all SECURITY DEFINER functions in `public` from anon and authenticated):

1. **Switch job processing to service_role**  
   In `apps/web/app/api/analysis/process/route.ts`, call `processOneJob` with **getAdminClient()** instead of **createClient()**.  
   - If `getAdminClient()` is null (SUPABASE_SERVICE_ROLE_KEY not set), return 503 with a clear message so deployments must set the key for job processing.
2. **Set SUPABASE_SERVICE_ROLE_KEY** in the environment where the web app runs (e.g. Cloudflare Worker / Node server) so the process route can use the admin client.

After that, revoking EXECUTE from anon and authenticated is safe: only the server (service_role) will call dequeue_job, claim_job_execution, and complete_analysis_job.

---

## Optional long-term

- Introduce a dedicated **worker** Postgres role with minimal privileges (e.g. EXECUTE only on job RPCs, no SELECT on admin views) and use a separate key for workers. Then revoke EXECUTE from anon/authenticated and grant only to that role and service_role.
