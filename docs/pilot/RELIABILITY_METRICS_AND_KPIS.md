# Reliability Metrics and Health KPIs

**Phase 6 — Pilot Deployment & Observability**

---

## Target KPIs (track or document)

| KPI | Description | Current state |
|-----|-------------|----------------|
| **Crash-free sessions** | % of sessions without app crash | Not instrumented; document path for iOS/Android SDK |
| **Auth success rate** | Successful sign-in / session refresh | Logged via `auth_login` event; aggregate from logs or future metrics |
| **Report submit success rate** | POST report/submit 200 vs 4xx/5xx | request_finished logs; aggregate by route and status |
| **Task assign success rate** | POST tasks/:id/assign 200 vs errors | request_finished logs |
| **Review action success rate** | PATCH reports/:id (review) 200 vs errors | Add withRequestIdAndTiming to review route; then aggregate |
| **Sync success/failure rate** | Sync cycles completed vs conflict/error | logStructured events (sync_conflict, device_last_seen_update_failed); sync status in mobile |
| **Upload success/failure rate** | Finalize and upload completion | Existing logStructured in upload-session and job handlers |
| **Notification generation/delivery** | Notifications created and push sent | Audit and push runbooks; no aggregate dashboard yet |
| **API 5xx/4xx hotspots** | Counts by route and status | request_finished and error_captured events; aggregate from logs |
| **p95 latency (key routes)** | 95th percentile duration_ms | request_finished has duration_ms; aggregate in log pipeline or metrics backend |

---

## Lightweight instrumentation (implemented)

- **Backend:** `request_finished` with route, method, status, duration_ms, tenant_id, user_id, request_id on instrumented routes. `error_captured` for exceptions with category and severity. No raw secrets in logs.
- **Log format:** JSON with `ts`, `event`, and event-specific fields; safe for ingestion (e.g. Cloudflare Logs, Datadog, or custom aggregator).

---

## Next instrumentation path

1. **Log aggregation:** Send structured logs to a single sink (e.g. Cloudflare Logs, Vercel Log Drain, or third-party). Filter and dashboard on `event`, `route`, `status`, `duration_ms`.
2. **Counters and SLIs:** From aggregated logs, compute: success rate per route (status 2xx vs 4xx/5xx), p95 duration per route, error_captured count by category.
3. **Mobile:** When crash/analytics SDK is added (e.g. Sentry), use crash-free session and breadcrumbs; optionally send non-PII events (e.g. “report_submit_started”, “report_submit_succeeded”) for client-side funnel.
4. **Alerts:** Define thresholds (e.g. 5xx rate > X%, p95 > Y ms) and alert from log/metrics pipeline; document in runbooks.

---

## Implementation status

- **Done:** Structured request_finished and error_captured; redaction; correlation with request_id and tenant/user where available.
- **Documented:** KPI list, current state, and exact next steps above.
- **Pending:** Central log aggregation, dashboards, and alerts; mobile crash/SLI instrumentation when SDK is added.
