# Monitoring setup pack

**Purpose:** Operator-executable steps to get minimal monitoring for pilot. Alerts are **not** wired in app code; use external checks and (optionally) webhooks.

---

## 1. Health check (minimum)

**What:** HTTP GET to your app health endpoint every 5 minutes. Alert if non-200 or body does not contain `"ok":true`.

**Command to run (or configure in any HTTP monitor):**

```bash
curl -sS -o /dev/null -w "%{http_code}" --max-time 10 "https://YOUR_APP/api/health"
# Expect: 200

curl -sS --max-time 10 "https://YOUR_APP/api/health" | grep -q '"ok"'
# Expect: exit 0
```

**Where to configure:**
- **Better Uptime:** Monitor → Create → HTTP(s) → URL `https://YOUR_APP/api/health` → Check interval 5 min → Alert when status ≠ 200 or body doesn’t match.
- **Checkly:** Similar HTTP check.
- **GitHub Actions (scheduled):** Workflow that curls and fails job on non-200; no secret needed for public health.
- **UptimeRobot / Pingdom:** URL monitor to `https://YOUR_APP/api/health`.

**Verify success:** Turn off app or use wrong URL; alert fires (or check fails).

---

## 2. Cron-tick check (optional)

**What:** Verify cron-tick returns 2xx when called with secret. Requires storing CRON_SECRET in the monitoring system.

**Command (do not log output with secret):**

```bash
code=$(curl -sS -o /dev/null -w "%{http_code}" -X POST -H "x-cron-secret: $CRON_SECRET" "https://YOUR_APP/api/v1/admin/jobs/cron-tick")
test "$code" = "200" || exit 1
```

**Where:** Same as above (e.g. Checkly/Better Uptime with custom script or request with header). Store CRON_SECRET as secret/env in the tool.

---

## 3. 5xx and error rate

**What:** Observe 5xx rate from Cloudflare Workers (Dashboard → Workers → your worker → Metrics) or from log drain. No in-app alert; use CF alerts or log-based alerts if available.

**Action:** In Cloudflare, configure alert when error rate or 5xx count exceeds threshold (if your plan supports it). Or use a log aggregation service (e.g. Datadog, Axiom) and alert on pattern `"status":5` or similar.

---

## 4. AI failure spike

**What:** High rate of AI failures (503 or errors from analyze-image). No built-in metric; infer from logs or from `ai_usage` / application logs.

**Action:** Optional. If you have log search (see LOG_SEARCH_QUERIES.md), alert on high count of e.g. `request_finished` with route containing `analyze-image` and status 5xx.

---

## 5. Dashboards

- **Cloudflare:** Workers → your worker → Metrics (requests, errors, CPU).
- **Supabase:** Dashboard → Reports (API usage, DB).
- **App:** GET /api/v1/ops/overview and /api/v1/ops/metrics (tenant-scoped; need auth). Use for manual checks or internal dashboard.

---

## Summary

| Check        | Minimum for pilot | How |
|-------------|--------------------|-----|
| Health      | Yes                | External HTTP monitor to /api/health every 5 min; alert on non-200 or !ok |
| Cron-tick   | Optional           | Script or HTTP POST with secret; alert on non-2xx |
| 5xx         | Optional           | Cloudflare or log-based alert |
| AI failures | Optional           | Log search / custom metric |
