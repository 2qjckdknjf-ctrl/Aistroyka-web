# Jobs processing runbook

## Overview

`POST /api/v1/jobs/process` runs the job worker: it claims pending jobs from the queue, executes handlers (AI analysis, exports, etc.), and updates status. It is intended to be invoked on a schedule (e.g. every 1–5 minutes) or on demand by an admin.

## Supported strategy

- **Recommended (single tick):** Call **POST /api/v1/admin/jobs/cron-tick** on a schedule (e.g. every 1–5 min). It (1) enqueues `upload_reconcile` per tenant and (2) runs job processing. See **docs/operations/CRON_SETUP.md** for Cloudflare/Vercel wiring.
- **Alternative (two-step):** Call **POST /api/v1/admin/jobs/schedule-reconcile** then **POST /api/v1/jobs/process**.
- **Jobs only:** Call **POST /api/v1/jobs/process** directly (tenant session or cron secret) if you only need to run the worker without scheduling reconcile.

The endpoint requires **tenant context** (authenticated user with tenant) and **admin scope** (`jobs:process` → role admin or owner). When `REQUIRE_CRON_SECRET` is set, the request must also include a valid `x-cron-secret` header (see below).

## Required env vars

| Variable | Required | Description |
| ---------- | ---------- | ------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Backend and job processing use the admin client. |
| `REQUIRE_CRON_SECRET` | Optional | If `true`, requests must include `x-cron-secret` matching `CRON_SECRET`. |
| `CRON_SECRET` | When using `REQUIRE_CRON_SECRET` | Shared secret for cron/scheduler calls. |

## Schedule

- **Frequency:** Every 1–5 minutes is typical. Adjust based on job volume and latency needs.
- **Concurrency:** One caller per tenant (or use a distributed lock) to avoid duplicate work. The worker claims jobs by `tenant_id` and updates `run_by` / `run_after`.

## How to test manually

1. **With browser/session (admin user):**

   ```bash
   curl -X POST "https://<your-host>/api/v1/jobs/process" \
     -H "Cookie: <session-cookie>" \
     -H "Content-Type: application/json"
   ```

2. **With cron secret (when `REQUIRE_CRON_SECRET=true`):**

   ```bash
   curl -X POST "https://<your-host>/api/v1/jobs/process" \
     -H "x-cron-secret: <CRON_SECRET value>" \
     -H "Cookie: <session-cookie>" \
     -H "Content-Type: application/json"
   ```

3. **Optional query:** `?limit=10` to cap jobs per run (default from `JOB_CONFIG.DEFAULT_CLAIM_LIMIT`).

## Expected responses

| Status | Meaning |
| ------ | ------- |
| 200 | Success. Body: `{ ok: true, processed, success, failed, dead }`. |
| 401 | Not authenticated (missing or invalid session). |
| 403 | Not authorized (non-admin) or, when `REQUIRE_CRON_SECRET=true`, missing/invalid `x-cron-secret` (body includes `code: "cron_unauthorized"`). |
| 429 | Rate limited. |
| 503 | Job processing not configured (e.g. missing service role key). |

## Troubleshooting

- **403 "Insufficient rights"** — Caller must be tenant admin or owner (role from membership).
- **403 "cron_unauthorized"** — `REQUIRE_CRON_SECRET` is set; provide correct `x-cron-secret` header.
- **503 "Job processing not configured"** — `getAdminClient()` returned null; set `SUPABASE_SERVICE_ROLE_KEY` (and URL).
- **No jobs run** — Check that jobs exist in the queue for the tenant and are in a claimable state (`pending`, `run_after` in the past). Check worker logs for claim/handler errors.
