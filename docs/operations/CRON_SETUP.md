# Cron setup: single tick endpoint

This doc describes how to wire a cron schedule to the **single cron tick** endpoint so that upload reconciliation and job processing run on a schedule (e.g. every 1–5 minutes).

## Endpoint

| Method | URL | Purpose |
|--------|-----|--------|
| POST | `/api/v1/admin/jobs/cron-tick` | Enqueue `upload_reconcile` per tenant (tenant-scoped dedupe) and run job processing. |

**Response (200):** `{ ok: true, scheduled: number, processed: number, tenants: string[] }`

**Auth:** When `REQUIRE_CRON_SECRET=true`, the request must include header `x-cron-secret: <CRON_SECRET>`.

---

## Cloudflare Workers (Cron Trigger)

1. In **wrangler.toml** (or dashboard), add a Cron Trigger to the Worker that serves the app:

   ```toml
   [triggers]
   crons = ["*/5 * * * *"]   # every 5 minutes
   ```

2. In the Worker entrypoint, when the request is a **scheduled** request (e.g. `event.cron` or `event.scheduled`), issue a request to your own app:

   ```ts
   if (event.cron === "*/5 * * * *") {
     const url = new URL(request.url);
     const origin = url.origin;
     const res = await fetch(`${origin}/api/v1/admin/jobs/cron-tick`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         ...(process.env.REQUIRE_CRON_SECRET === "true" && process.env.CRON_SECRET
           ? { "x-cron-secret": process.env.CRON_SECRET }
           : {}),
       },
     });
     // log res.status, await res.json() for scheduled/processed
   }
   ```

3. **Secrets:** Set `CRON_SECRET` (and optionally `REQUIRE_CRON_SECRET=true`) in Cloudflare Dashboard → Workers → Settings → Variables and Secrets.

4. **Note:** With OpenNext/Next on Cloudflare, the cron trigger runs in the Worker; the Worker must call the app’s own URL (same zone or public) so the Next app handles `/api/v1/admin/jobs/cron-tick`. Ensure the origin used in `fetch` is the same host that serves the app (e.g. your custom domain or workers.dev).

---

## Vercel (Cron Jobs)

1. In **vercel.json**, add a cron job that hits the cron-tick endpoint:

   ```json
   {
     "crons": [
       {
         "path": "/api/v1/admin/jobs/cron-tick",
         "schedule": "*/5 * * * *"
       }
     ]
   }
   ```

2. Vercel sends an internal request to the app; the request may include `Authorization: Bearer <CRON_SECRET>` or a special header depending on plan. To use `x-cron-secret`:
   - Configure **CRON_SECRET** and **REQUIRE_CRON_SECRET=true** in Vercel → Project → Settings → Environment Variables.
   - If Vercel injects a different auth header for cron, your route can check that instead; the cron-tick route expects `x-cron-secret` when `REQUIRE_CRON_SECRET` is true.

3. **Verification:** After deploy, trigger the cron or wait for the schedule; check logs for 200 and response body `{ ok, scheduled, processed, tenants }`.

---

## External scheduler (e.g. GitHub Actions, system cron)

1. **Frequency:** Every 1–5 minutes (e.g. `*/5 * * * *`).

2. **curl example:**

   ```bash
   curl -X POST "https://<your-host>/api/v1/admin/jobs/cron-tick" \
     -H "Content-Type: application/json" \
     -H "x-cron-secret: $CRON_SECRET"
   ```

3. Store `CRON_SECRET` in the scheduler’s secrets (e.g. GitHub Actions secrets, env file on the server). Set `REQUIRE_CRON_SECRET=true` in the app so unauthenticated callers get 403.

---

## Verification

- **200** and body `{ ok: true, scheduled: N, processed: M, tenants: [...] }` — success.
- **403** with `code: "cron_unauthorized"` — missing or wrong `x-cron-secret` when `REQUIRE_CRON_SECRET=true`.
- **503** — job processing not configured (e.g. missing `SUPABASE_SERVICE_ROLE_KEY`).

See **docs/runbooks/JOBS_PROCESSING.md** and **docs/runbooks/INCIDENT_UPLOADS_STUCK.md** for troubleshooting.
