# Cron and jobs runbook

## Production requirement

- **REQUIRE_CRON_SECRET=true** and **CRON_SECRET** must be set in production.
- Cron-tick endpoint: **POST /api/v1/admin/jobs/cron-tick**
- Header: **x-cron-secret: <CRON_SECRET>**

When REQUIRE_CRON_SECRET is true but CRON_SECRET is missing, the endpoint returns **503** with `code: cron_secret_misconfigured`.

## What cron-tick does

1. Enqueues **upload_reconcile** per tenant (stuck upload cleanup).
2. Enqueues **ops_events_prune** per tenant.
3. Runs **processJobs** (claims and executes queued jobs across all tenants).

## Verifying cron

```bash
# From repo root
export CRON_TICK_URL="https://your-app.com/api/v1/admin/jobs/cron-tick"
bash scripts/verify-cron-hardening.sh
```

Manual with secret:

```bash
curl -X POST -H "x-cron-secret: $CRON_SECRET" "$CRON_TICK_URL"
# Expect 200 and {"ok":true,"scheduled":N,"processed":N,"tenants":N}
```

## Stuck jobs

1. **Admin UI:** Dashboard → Admin → Jobs (or GET /api/v1/admin/jobs?status=failed). Shows failed/dead jobs for your tenant.
2. **Causes:** Job handler error, timeout, or provider (e.g. AI) down. Check `last_error` and `last_error_type` on the job row.
3. **Retry:** Re-queue by creating a new job of same type with same payload/dedupe_key, or fix underlying issue and let retries run (jobs have max_attempts).
4. **upload_reconcile:** Cleans up upload_sessions that are stuck in "created" or "uploaded" and past expiry. If uploads stay stuck, ensure cron-tick is being called on schedule and SUPABASE_SERVICE_ROLE_KEY is set.

## Upload reconcile

- Runs per tenant from cron-tick.
- Dedupe key: `upload_reconcile:<tenant_id>` so one per tenant per tick.
- Handler: marks expired sessions, cleans up; see `lib/platform/jobs/job.handlers/upload-reconcile`.

## Job processing (jobs/process)

- **POST /api/v1/jobs/process** — tenant-authenticated or cron-secret. Used by HTTP workers or by cron-tick.
- Rate-limited per tenant. Requires tenant context (cookie) or cron secret.
- Claims jobs from queue; runs handlers (ai-analyze-media, ai-analyze-report, upload_reconcile, etc.).

## Failure visibility

- **Failed jobs:** GET /api/v1/admin/jobs?status=failed (admin only).
- **Metrics:** tenant_daily_metrics has jobs_processed, jobs_failed.
- **DB:** jobs table status in (queued, running, success, failed, dead).
