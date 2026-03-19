# Step 17 — Incident Readiness Inventory

## 1. What incident-readiness capability already exists

### 1.1 Release / rollback / recovery docs

- **release/PHASE3_ROLLBACK_REALITY_AUDIT.md:** Truthful rollback reality: web redeploy via revert or workflow_dispatch with ref; no one-click rollback; DB fix-forward or Supabase PITR; smoke failure does not auto-revert.
- **release/DESIGN_RELEASE_ROLLBACK.md, DESIGN_RELEASE_VALIDATION.md:** Design context for release and validation.
- **DEPLOY_VERIFY.md:** How to verify latest deploy (workers.dev URL, production domain, what to check in GitHub Actions and Cloudflare Dashboard).
- **No automated rollback in repo;** operator-driven revert + redeploy or dispatch with known-good ref.

### 1.2 Centralized observability (Step 16)

- **GET /api/v1/admin/ops/diagnostics:** Single view: correlation (build_sha, build_time, app_env), ops_metrics, ai_runtime (by_route, error_count, error_rate_window, recent_error_sample), job_failures (by_type, total, recent), operator_hints.
- **GET /api/v1/ops/metrics, GET /api/v1/ops/overview:** Tenant-scoped; both now include correlation.
- **GET /api/v1/admin/ops/ai-runtime:** AI runtime audit drilldown; correlation; operator_hints (classify_401, 403, 503, correlate).

### 1.3 AI runtime diagnostics

- **audit_logs** resource_type=ai_runtime; actions include *_complete, *_error. details: route, latency_ms, provider, error_kind, retryable.
- **PHASE8_AI_FAILURE_TAXONOMY.md (observability):** AIErrorKind mapping (provider_unavailable, provider_timeout, rate_limit, auth_failure, etc.).
- **Circuit breaker / provider health:** ai_provider_health table and circuit state referenced in existing playbooks; provider failure visibility via audit errors_by_kind and by_route.

### 1.4 Job / cron visibility

- **jobs table:** type, status, last_error, tenant_id, created_at. getFailedJobs(tenantId, limit); getOpsMetrics includes jobs_failed, ai_failed (AI job types); getOpsOverview includes aiFailed queue.
- **GET /api/v1/admin/ops/diagnostics:** job_failures.by_type, job_failures.total, job_failures.recent with last_error_preview.
- **Cron:** /api/v1/admin/jobs/cron-tick; job types documented in job.types.

### 1.5 Upload / media failure visibility

- **ops_metrics:** uploads_stuck, uploads_expired. ops_overview: stuckUploads list.
- **No upload "failure reason" aggregation** beyond stuck/expired.

### 1.6 Auth / tenant failure visibility

- **error_captured** (log-only) with category auth, tenant_context. No DB table of auth failures; audit has login action on success.

### 1.7 Provider failure visibility

- **AI:** audit ai_runtime errors_by_kind (provider_timeout, provider_unavailable, rate_limit, etc.) and by_route. No dedicated "provider health" API in repo; circuit breaker state in ai_provider_health (if used by code paths).
- **Supabase:** Health check GET /api/health (db: ok). No Supabase status API in repo.

### 1.8 Post-deploy verification

- **Smoke:** pilot-smoke (health, config, cron-tick, ops/metrics) runs after deploy; does not block or revert deploy.
- **DEPLOY_VERIFY.md:** What to check after deploy (GitHub Actions, Cloudflare Dashboard, browser).
- **No formal "release-blocking" checklist in repo** that gates deploy or freeze.

### 1.9 Existing playbooks and operator docs

- **INCIDENT-PLAYBOOKS.md:** Short playbooks for AI provider outage, Supabase degraded, upload failures, job queue stuck, abuse/cost spike. No triage taxonomy or escalation paths.
- **operations/STEP9_OPERATOR_WORKFLOW_HARDENING.md:** Operator workflow context.
- **ADR/053-slo-tiers-playbooks.md:** SLO/playbook ADR.

---

## 2. Strongest existing response paths

- **Single diagnostics call:** GET /api/v1/admin/ops/diagnostics gives build + ops + AI + jobs in one place; operator can quickly see "what is failing, where, which build."
- **AI errors:** ai_runtime.recent_error_sample and errors_by_kind; operator_hints point to 503/computation vs provider. PHASE8_AI_FAILURE_TAXONOMY maps error_kind to cause.
- **Job failures:** job_failures.by_type and recent with last_error_preview; operator can see if failures are e.g. ai_analyze_media vs upload_reconcile.
- **Rollback:** Documented (revert + push or workflow_dispatch with ref); no automation.
- **Health:** GET /api/health for quick up/down; external monitor can alert.

---

## 3. Biggest missing incident-response gaps

- **No canonical incident taxonomy or triage model:** Operators lack a single "what type of incident is this" checklist with severity, first responder, and first action.
- **Runbooks are brief and not tied to diagnostics:** INCIDENT-PLAYBOOKS.md is high-level; no symptom → runbook mapping or stop-the-line rules.
- **Alert routing not wired:** No in-repo Slack/PagerDuty; no threshold config. Step 16 documented alertability; Step 17 should document alert policies and routing assumptions.
- **No explicit "freeze deploys" rule:** When to stop deploying is not formalized.
- **Escalation path not documented:** Who to escalate to and when.
- **Post-deploy discipline not formalized:** What must be checked, what counts as release-blocking, what evidence to record.
- **Provider health:** No single "provider health" view that summarizes which provider is failing; inference from ai_runtime.errors_by_kind and provider field in details.

---

## 4. Operator pain points

- Deciding "is this AI provider vs app bug vs config" requires correlating diagnostics + logs; no in-app "likely incident type" hint.
- Unclear when to rollback vs fix-forward vs disable feature; rollback reality is documented but decision tree is not.
- No single place that says "if X, do Y first and freeze deploys if Z."

---

## 5. Priority ranking

| Priority | Item | Rationale |
|----------|------|-----------|
| P0 | Incident taxonomy + triage model | So operators can classify and choose first action. |
| P0 | Runbooks with symptom → runbook, stop-the-line, escalation | So response is consistent and safe. |
| P1 | Alert policies (thresholds, page vs warn, routing assumptions) | So alerts, when wired, are actionable. |
| P1 | Provider health visibility (from existing audit) | So "one provider down" vs "all AI down" is clear. |
| P1 | Post-deploy verification discipline | So deploy freeze and release-blocking are explicit. |
| P2 | Incident hints in diagnostics response | Optional; nudge "likely incident type" from current data. |
