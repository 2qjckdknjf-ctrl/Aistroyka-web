# Step 16 — Alertability Foundation

## 1. Scope

This step makes the system **alert-ready**, not fully incident-ready (Step 17). We define alert-worthy event classes, severity, where signals come from, and routing assumptions. No external transport (Slack, PagerDuty) is wired in repo.

## 2. Alert-worthy event classes

| Class | Source | Severity | Description |
|-------|--------|----------|-------------|
| job_failed / job_dead | jobs table, getOpsMetrics, getFailedJobs | error | Background job failed or dead; last_error in row. |
| ai_runtime_error | audit_logs (resource_type=ai_runtime, action *_error) | error | AI request failed; error_kind in details. |
| upload_stuck | ops-metrics (uploads_stuck) | warn | Upload sessions stuck beyond threshold. |
| sync_conflict | ops_events (type=sync_conflict) | warn | Sync conflict count in window. |
| push_failed | push_outbox status=failed | warn | Push notifications failing. |
| auth_error | error_captured (category=auth) | error | Log-only; no DB. |
| api_5xx | error_captured (category=api_5xx) or status 5xx in request_finished | error | Log-only. |
| system_unhealthy | Health check failure | fatal | /api/health returns non-200. |

## 3. Severity thresholds (model)

- **fatal:** Immediate page (e.g. health down). Single occurrence can alert.
- **error:** Alert when rate or count exceeds threshold (e.g. error_rate_window > 0.1 for AI, or jobs_failed in last 1h > N). Exact thresholds to be set per environment.
- **warn:** Alert when sustained (e.g. uploads_stuck > 0 for > 1h). Optional daily digest.

## 4. Where alert signals would come from

- **DB-backed:** getOpsMetrics (jobs_failed, ai_failed, uploads_stuck, sync_conflicts, push_failed); getFailedJobs; listAiRuntimeAuditRows + aggregate (error_rate_window). Polling or cron that evaluates and emits.
- **Log-backed:** request_finished (status >= 500), error_captured. Requires log pipeline (e.g. Vercel/CF logs → external aggregator) to compute rate by route/category. Not in-app.
- **Health:** GET /api/health. External monitor can alert on non-2xx.

## 5. Routing assumptions

- **In-repo:** No webhook or HTTP callback for alerts. A future "alert sink" could be: internal API (e.g. POST /api/internal/alerts) called by a cron or log processor, which then forwards to Slack/PagerDuty. Not implemented.
- **External:** Operator can set up Uptime Robot, Better Stack, or similar on /api/health; and log-based alerts on error_captured / request_finished in their log platform.
- **Correlation:** Every alert payload should include build_sha7 and app_env so "which release" is known.

## 6. Explicit gaps

- No in-app alert transport (no Slack/PagerDuty client).
- No threshold configuration in repo (env or DB); thresholds are doc-only.
- No incident runbook or escalation in repo; Step 17.
- Log-based aggregation (error rate by route) is external.
