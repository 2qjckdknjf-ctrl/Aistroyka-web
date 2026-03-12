# Alerting execution pack

**Purpose:** Operator steps to wire minimal alerts. Alerts are **not** implemented in app code; use external monitors and webhooks.

---

## 1. Health failure

**Condition:** GET https://YOUR_APP/api/health returns non-200 or body does not contain `"ok":true`.

**Detection:** HTTP monitor (Better Uptime, Checkly, UptimeRobot, etc.) every 5 min.

**Action:** Alert channel (Slack, PagerDuty, email). Configure in the monitoring tool.

**Slack webhook payload (example — when your monitor calls a Slack Incoming Webhook):**

Monitor tools often let you set "Custom payload" or "Message body". Example JSON for Slack Incoming Webhook (tool sends POST to webhook URL with body):

```json
{
  "text": "🚨 [AISTROYKA] Health check failed: {{CHECK_URL}} returned {{HTTP_STATUS}} or ok:false. Time: {{timestamp}}"
}
```

Replace placeholders with your tool’s variables (e.g. `{{status_code}}`, `{{failed_at}}`).

**Generic webhook (e.g. PagerDuty Events API v2):**

```json
{
  "routing_key": "YOUR_INTEGRATION_KEY",
  "event_action": "trigger",
  "payload": {
    "summary": "AISTROYKA health check failed",
    "severity": "critical",
    "source": "pilot-monitor",
    "custom_details": {
      "url": "https://YOUR_APP/api/health",
      "timestamp": "{{timestamp}}"
    }
  }
}
```

---

## 2. Cron failure

**Condition:** POST to cron-tick with valid secret returns non-2xx (or timeout).

**Detection:** Same as MONITORING_SETUP_PACK: script or HTTP POST with header, run every 5–10 min. Store CRON_SECRET in the tool’s secrets.

**Action:** Alert on failure (e.g. 2 consecutive failures). Use same Slack/PagerDuty pattern as above; message: "AISTROYKA cron-tick failed (HTTP X or timeout)."

---

## 3. 5xx spike

**Condition:** Error rate or 5xx count from Workers exceeds threshold (e.g. >5% or >10 in 5 min).

**Detection:** Cloudflare Workers Metrics (Dashboard) or log drain. If using log aggregation, filter on status 5xx or `"status":5`.

**Action:** Alert from Cloudflare (if available on your plan) or from log-based alert in Datadog/Axiom/etc.

---

## 4. AI failure spike

**Condition:** Many AI requests failing (503 or error from analyze-image).

**Detection:** Log search (see LOG_SEARCH_QUERIES.md) for route containing `analyze-image` and status 5xx; or query `ai_usage` / application logs if you have them.

**Action:** Optional. Create log-based alert: e.g. "count of request_finished where route contains analyze-image and status >= 500 in last 15 min > 10."

---

## Summary

| Alert           | Trigger                    | Where to configure     |
|----------------|----------------------------|-------------------------|
| Health failure | Health check non-200/!ok   | Uptime/monitor tool    |
| Cron failure   | Cron-tick non-2xx          | Same + script with secret |
| 5xx spike      | Workers errors / log count | Cloudflare or log tool |
| AI spike       | Log pattern (optional)     | Log aggregation        |

No code changes required; all external configuration.
