# Step 17 — Alert Policies and Thresholds

## 1. Scope

Alert policies define **what** should alert, **when** (threshold), and **how** (page vs warn). Actual routing (Slack, PagerDuty) is not wired in repo; document routing assumptions. Policies are explicit and actionable so that when transport is added, operators know what each alert means.

---

## 2. Alert-worthy event classes (from Step 16, extended)

| Class | Source | Severity | Page immediately? | Threshold / condition |
|-------|--------|----------|--------------------|------------------------|
| **system_unhealthy** | GET /api/health non-2xx | fatal | Yes | Single failure from external monitor. |
| **post_deploy_smoke_fail** | CI pilot-smoke after deploy | high | Yes | Smoke failed; new code is live. |
| **ai_runtime_error_spike** | audit_logs ai_runtime *_error | error | Yes if rate high | error_rate_window > 0.2 over 15–30 min window; or error_count > N in window. |
| **job_failure_spike** | jobs failed/dead; getOpsMetrics | error | Warn first | jobs_failed in last 1h > 5 (configurable); page if > 20 or same type recurring. |
| **upload_stuck** | ops_metrics.uploads_stuck | warn | No (warn) | uploads_stuck > 0 for > 1h. |
| **sync_conflict_spike** | ops_events sync_conflict | warn | No | sync_conflicts in window > threshold (e.g. 10). |
| **push_failed** | push_outbox failed | warn | No | push_failed > 0; optional digest. |
| **auth_error** | error_captured category=auth | error | Yes if sustained | Log-only; require log pipeline. Page if auth_error count in 15 min > N. |
| **api_5xx** | request_finished status >= 500 | error | Yes if rate high | Log-only. Page if 5xx rate > 5% over 10 min. |

---

## 3. Severity mapping

- **Page immediately (fatal/high):** system_unhealthy, post_deploy_smoke_fail. Single occurrence or first occurrence in window.
- **Page when threshold hit (error):** ai_runtime_error_spike, job_failure_spike (if high), auth_error (sustained), api_5xx (rate high).
- **Warn / digest (warn):** upload_stuck, sync_conflict_spike, push_failed, job_failure_spike (low count).

---

## 4. Threshold logic (policy examples)

- **AI error rate:** Poll diagnostics (or audit) every 5–10 min; compute error_rate_window for last 30 min. Alert if > 0.2. Include in payload: build_sha, error_count, errors_by_kind (top 3), recent_error_sample (first 3).
- **Job failures:** Poll ops_metrics or getFailedJobs every 10 min. Alert if jobs_failed (in last 1h) > 5. Page if > 20 or if same job type has > 3 in 30 min. Include job_failures.by_type and one recent last_error_preview per type.
- **Upload stuck:** Poll ops_metrics every 15 min. Warn if uploads_stuck > 0 for 2 consecutive checks. Include tenant_id if multi-tenant.

---

## 5. Correlation with diagnostics sources

Every alert payload should include:
- **correlation.build_sha** (or build_sha7), **build_time**, **app_env** so "which release" is known.
- **tenant_id** if alert is tenant-scoped (optional; avoid PII).
- **Link or hint:** "Run GET /api/v1/admin/ops/diagnostics for full view."

---

## 6. Operator hints per class

| Class | Operator hint |
|-------|----------------|
| system_unhealthy | Check /api/health; check platform (CF/Vercel) status; check last deploy. |
| post_deploy_smoke_fail | Rollback or fix-forward; see runbook "Deploy / post-deploy app failure". |
| ai_runtime_error_spike | Open diagnostics ai_runtime; check errors_by_kind (provider vs auth); see runbook "AI provider degradation". |
| job_failure_spike | Open diagnostics job_failures.by_type; see runbook "Job / cron failures". |
| upload_stuck | Check ops_metrics and storage; see runbook "Upload / media incident". |
| auth_error | Check Supabase Auth; see runbook "Auth / tenant incident". |

---

## 7. Routing assumptions (no transport in repo)

- **In-repo:** No Slack/PagerDuty client. No webhook. A future cron or log processor could call an internal endpoint that forwards to external alerting; not implemented.
- **External:** Operator configures:
  - Uptime Robot or Better Stack on GET /api/health → page on down.
  - CI notification on pilot-smoke failure (e.g. GitHub Actions failure notification).
  - Optional: polling script that hits GET /api/v1/admin/ops/diagnostics (with admin auth), evaluates thresholds, and sends to Slack/PagerDuty. Script and thresholds are out-of-repo or in ops repo.
- **Correlation:** Any external alert must include build_sha and app_env in the message.

---

## 8. Explicit gaps

- No threshold configuration in repo (env or DB); thresholds are doc-only.
- No automated alert sender in repo.
- Log-based alerts (auth_error, api_5xx) require external log pipeline.
