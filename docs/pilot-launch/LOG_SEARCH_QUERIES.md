# Log search queries

**Purpose:** Find requests and errors in Cloudflare Workers logs or log-drain output. Adjust to your log format (e.g. JSON with `request_id`, `route`, `status`, `duration_ms`).

---

## By request_id

If your app logs structured JSON with `request_id` (or `x-request-id` propagated):

**Example (generic JSON log):**
```
request_id:"abc-123-def"
```
or
```
"request_id":"abc-123-def"
```

Use your log tool’s search (e.g. Cloudflare Logpush, Datadog, Axiom). Example for Axiom/Elastic:
- Field: `request_id` equals `abc-123-def`

---

## Cron-tick failures

**Pattern:** Requests to cron-tick that did not succeed.

**Example (JSON logs):**
```
"route":"POST /api/v1/admin/jobs/cron-tick" AND ("status":503 OR "status":403 OR "status":5)
```
or
```
route:*cron-tick* status:>=400
```

**Cloudflare Workers:** Filter by path `/api/v1/admin/jobs/cron-tick` and status 4xx/5xx.

---

## AI / analyze-image failures

**Pattern:** Vision or analyze requests that failed.

**Example (JSON logs):**
```
"route":*analyze* ("status":503 OR "status":5)
```
or
```
route:*analyze* status:>=500
```

---

## High latency

**Pattern:** Slow requests (e.g. >10s).

**Example (JSON logs):**
```
duration_ms:>10000
```
or
```
"duration_ms":>10000
```

---

## Error response bodies (no secrets)

App returns JSON `{ "error": "...", "error_code": "..." }`. To find specific codes:

**Examples:**
```
"error_code":"cron_tick_error"
"error_code":"cron_unauthorized"
"error_code":"cron_secret_misconfigured"
"error_code":"admin_not_configured"
```

---

## Note

Actual field names depend on your logging format. Our app uses `logStructured({ event, request_id, route, status, duration_ms, ... })`. If you use Cloudflare Workers built-in logging, check the dashboard for available filters.
