# Phase 2 — Cron Production Activation

**Goal:** Ensure scheduled jobs run in production with secret protection.

---

## REQUIRE_CRON_SECRET default and production safety

- **Default:** When `REQUIRE_CRON_SECRET` is **not** set or not `true`, the cron endpoints **do not** require a secret. Anyone who can reach the URL can trigger cron-tick.
- **Production:** Set `REQUIRE_CRON_SECRET=true` and set `CRON_SECRET` to a strong random value. Then only requests that include `x-cron-secret: <CRON_SECRET>` are accepted.
- **Safe for production:** Yes — as long as you set both env vars. The code returns 503 if `REQUIRE_CRON_SECRET=true` but `CRON_SECRET` is missing (server misconfiguration).

---

## Cloudflare Cron Trigger setup

1. **Dashboard:** Cloudflare Dashboard → **Workers & Pages** → your Worker → **Triggers** → **Cron Triggers**.
2. **Add trigger:**
   - **Schedule:** e.g. `*/5 * * * *` (every 5 minutes) or `* * * * *` (every minute). Use [cron expression](https://developers.cloudflare.com/workers/configuration/cron-triggers/) (standard 5-field).
   - **Endpoint:** Your Worker URL path: `/api/v1/admin/jobs/cron-tick` (full URL = your Worker route, e.g. `https://aistroyka.ai/api/v1/admin/jobs/cron-tick`).
3. **Headers:** Cloudflare Cron Triggers do not support custom headers by default. Use one of:
   - **Option A (recommended):** Use a **Worker that calls your app** with the secret. Create a small Worker that runs on schedule and does `fetch(your-app-url, { headers: { "x-cron-secret": secret } })` where `secret` is a secret binding (e.g. `CRON_SECRET` in the same Worker’s env). That Worker’s cron trigger hits the Worker; the Worker then POSTs to your Next/OpenNext app with the header.
   - **Option B:** If your app is also a Worker (OpenNext), use **Environment Variables** for the Worker: set `CRON_SECRET`. Then use **Scheduled Handlers** in the same Worker: in `wrangler.toml` add `[triggers]` with `crons = ["*/5 * * * *"]` and in code handle the scheduled event by calling the same cron-tick logic with the secret from env. (Implementation is app-specific; see your Worker entrypoint.)
   - **Option C:** External scheduler (e.g. GitHub Actions, cron server) that runs `curl -X POST -H "x-cron-secret: $CRON_SECRET" https://aistroyka.ai/api/v1/admin/jobs/cron-tick` on a schedule.

4. **Secrets:** Store `CRON_SECRET` in Cloudflare Worker **Variables and Secrets** (encrypted). Never commit it.

---

## Copy-paste curl commands

**With secret (expected 200):**

```bash
curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: YOUR_CRON_SECRET" \
  https://aistroyka.ai/api/v1/admin/jobs/cron-tick
```

Replace `YOUR_CRON_SECRET` and the host. **Expected:** JSON with `ok: true` and HTTP 200.

**Without secret (expected 403 or 503 when REQUIRE_CRON_SECRET=true):**

```bash
curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  https://aistroyka.ai/api/v1/admin/jobs/cron-tick
```

**Expected:** HTTP 403 with body `{"error":"Unauthorized","code":"cron_unauthorized"}` or 503 if `CRON_SECRET` is not set.

---

## Failure diagnosis

| Symptom | Cause | Fix |
|---------|--------|-----|
| 403 with `cron_unauthorized` when using header | Secret mismatch or wrong header name | Use header `x-cron-secret` and same value as `CRON_SECRET` in Worker env. |
| 503 with `cron_secret_misconfigured` | `REQUIRE_CRON_SECRET=true` but `CRON_SECRET` empty | Set `CRON_SECRET` in Cloudflare Variables. |
| 200 without secret | `REQUIRE_CRON_SECRET` not set or not `true` | Set `REQUIRE_CRON_SECRET=true` in production. |
| Cron never runs | No trigger or wrong URL | Configure Cron Trigger (or external cron) to POST to `/api/v1/admin/jobs/cron-tick` with `x-cron-secret` header. |

---

## Verification script

Run `scripts/verify-prod-cron.sh` (see Phase 2 deliverables). It checks:

1. With secret → 200 and `ok: true`.
2. Without secret → 403 or 503.
