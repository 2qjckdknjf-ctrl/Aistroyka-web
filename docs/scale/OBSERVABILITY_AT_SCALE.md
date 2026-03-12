# Observability at Scale

**Phase 9 — Scale Infrastructure**  
**Centralized visibility for growth and reliability.**

---

## Log aggregation

- **Current:** Structured logs (`request_finished`, `error_captured`, etc.) to stdout via `logStructured()`. No in-repo aggregation pipeline.
- **Target:** Ship stdout/stderr to a central sink (e.g. Vercel Log Drain, Cloudflare Workers Tail / Logpush, Datadog, or similar). Index by: `event`, `request_id`, `route`, `tenant_id`, `status`, `duration_ms`, `ts`.
- **Retention:** Minimum 30 days for pilot; 90 days or more for production; align with DATA-RETENTION-STRATEGY and compliance.
- **Privacy:** No PII or secrets in logs; redaction already in logger. Ensure sink access is restricted and tenant_id is not exposed to unauthorized viewers.

---

## Service dashboards

- **Health:** Uptime of /api/health and /api/v1/health; green/red by region or deployment.
- **Request volume:** Requests per minute/hour by route (or route group); filter by tenant_id for tenant-level view.
- **Dependencies:** Supabase connectivity; external AI provider availability (if observable); push delivery status.
- **Build:** Last deploy time and commit; optional build success/failure trend.

---

## KPI dashboards

- **Success rate:** % 2xx by route (and optionally by tenant). Target: ≥ 99% for critical routes over 5-min windows.
- **Error rate:** Count of 4xx/5xx and error_captured by route and category. Target: < 1% 5xx.
- **Latency:** p50, p95, p99 duration_ms by route. Target: p95 < 3s for API routes (excluding long-running AI).
- **Throughput:** Requests/sec or/min by route; job processing rate (jobs completed per minute).
- **Activation/usage (product):** From product_events if implemented: logins, task_assigned, report_submitted, report_reviewed (see PRODUCT_ANALYTICS_PLAN).

---

## Error rate dashboards

- **5xx by route and tenant:** Identify hotspots and affected tenants.
- **error_captured by category:** auth, tenant_context, report_submit, upload, sync, task_assign, api_5xx, etc.
- **Rate limit (429):** Count by endpoint and tenant; detect abuse or need for limit increase.
- **Alert:** When 5xx rate > threshold (e.g. 1%) over 5 min for a route or globally.

---

## Latency dashboards (p95)

- **By route:** p95 duration_ms from request_finished. Critical routes: /api/auth/login, /api/v1/worker/report/submit, /api/v1/sync/changes, /api/v1/sync/ack, /api/v1/media/upload-sessions (GET/POST), /api/v1/ai/analyze-image (separate target for long AI).
- **By tenant:** Optional; filter by tenant_id to spot noisy tenants.
- **Target:** p95 < 2–3s for sync/report/upload; < 5s for AI (or provider-bound). Document targets in SLO.

---

## Tenant-level visibility

- **Metrics:** Per tenant_id: request count, error count, p95 latency, rate-limit hits, job queue depth (if exposed).
- **Access control:** Only org admin or support with authorization; no tenant seeing other tenants’ metrics.
- **Use:** Noisy-neighbor identification; capacity planning; support troubleshooting.

---

## SLO targets

| SLO | Target | Window |
|-----|--------|--------|
| **Availability** | 99.5% successful requests (2xx/3xx) | 30 days |
| **Error budget** | 5xx rate ≤ 0.5% | 30 days |
| **Latency (API)** | p95 ≤ 3s for non-AI routes | 30 days |
| **Latency (AI)** | p95 ≤ 30s for AI analyze (provider-bound) | 30 days |
| **Job processing** | 95% of jobs complete within 5 min of run_after | 7 days |

Adjust targets with product and ops; document in runbook.

---

## Alert thresholds

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| **Health down** | /api/health returns non-2xx | P0 | Page on-call; check deploy and deps. |
| **5xx spike** | 5xx rate > 1% over 5 min (global or per route) | P0/P1 | Page; triage by route and tenant. |
| **p95 high** | p95 > 5s for critical route over 15 min | P1 | Investigate DB, external calls, cold start. |
| **Error rate spike** | error_captured rate 2× baseline over 10 min | P1 | Correlate with deploy or provider. |
| **Rate limit surge** | 429 rate > 10% for an endpoint | P2 | Check abuse or need for limit increase. |
| **Job backlog** | Queued jobs > N (e.g. 1000) or growing 20% in 10 min | P2 | Check job processor and cron. |

---

## Alert routing

- **P0:** On-call (PagerDuty, Opsgenie, or equivalent); immediate response.
- **P1:** On-call; response within SLA (e.g. 1 hour).
- **P2:** Ticket or channel; triage within 24h.
- **Document:** Escalation path and runbook links in alert payload. See INCIDENT_RESPONSE_PLAYBOOK.

---

## Implementation notes

- **No in-repo implementation:** Dashboards and alerts are configured in the chosen observability platform (Datadog, Cloudflare Analytics, etc.). This doc defines what to build.
- **Data source:** Structured logs (request_finished, error_captured) and any metrics exported from the app or platform (e.g. Cloudflare Workers metrics). Ensure log pipeline is in place first (see RELIABILITY_HARDENING, Phase 7).
