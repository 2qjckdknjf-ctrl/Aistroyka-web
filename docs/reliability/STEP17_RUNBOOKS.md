# Step 17 — Incident Runbooks

Operator-usable runbooks. Use GET /api/v1/admin/ops/diagnostics (admin, tenant-scoped) for evidence. See STEP17_INCIDENT_TRIAGE_MODEL.md for taxonomy.

---

## 1. AI provider degradation

**Symptom pattern:** ai_runtime.error_count elevated; errors_by_kind shows provider_timeout, provider_unavailable, or rate_limit. One route or one provider may dominate.

**Probable causes:** Upstream AI provider (OpenAI, Anthropic, Gemini) down, slow, or rate-limiting.

**Immediate checks:**
1. GET /api/v1/admin/ops/diagnostics — ai_runtime.errors_by_kind, recent_error_sample (provider in details if present).
2. Check provider status pages (OpenAI, Anthropic, Google).
3. If circuit breaker in use: check ai_provider_health (if exposed); fallback may already be active.

**Stop-the-line:** Do not deploy new AI-related code until provider stable. No DB changes.

**Rollback vs fix-forward:** Usually **monitor**; fallback provider may be serving. If all providers failing, **disable** AI analysis via feature flag for affected tenants if available; then **fix-forward** when provider recovers. Rollback only if recent deploy introduced provider config break.

**Escalation:** If all providers down and feature flag not available, escalate for decision (disable vs wait).

**Verification after mitigation:** Diagnostics ai_runtime.error_rate_window decreases; new requests complete.

---

## 2. Job / cron failures

**Symptom pattern:** ops_metrics.jobs_failed > 0; job_failures.by_type shows one or more types (e.g. ai_analyze_media, upload_reconcile).

**Probable causes:** Worker crash; provider failure (for AI jobs); storage/DB timeout; bug in job handler; concurrency cap hit.

**Immediate checks:**
1. GET /api/v1/admin/ops/diagnostics — job_failures.by_type, job_failures.recent (last_error_preview).
2. Identify dominant job type. Check last_error for "timeout", "policy blocked", "storage", etc.
3. If ai_analyze_* dominant, cross-check ai_runtime (provider issue). If upload_reconcile, check uploads_stuck and storage.

**Stop-the-line:** Do not run migration or deploy if job failures are unexplained. If recurring and same job type, fix or disable that job path before more deploys.

**Rollback vs fix-forward:** **Fix-forward** for known handler bug or config. **Rollback** only if last deploy changed job processor or deps and failures started right after. Release stuck jobs (mark failed/dead) if worker crashed; restart job processor if applicable.

**Escalation:** If jobs_failed is large and queue is backing up, escalate for prioritization.

**Verification after mitigation:** job_failures.total stops growing; new jobs of that type succeed (re-run one if possible).

---

## 3. Upload / media incident

**Symptom pattern:** ops_metrics.uploads_stuck > 0; uploads_expired rising; user reports "upload failed".

**Probable causes:** Storage bucket quota; storage policy error; request size/MIME config blocking; finalize endpoint failing.

**Immediate checks:**
1. GET /api/v1/ops/overview — stuckUploads list; GET /api/v1/ops/metrics — uploads_stuck, uploads_expired.
2. Check storage bucket in Supabase Dashboard (usage, errors).
3. Check request size limits and MIME allowlist in app config.

**Stop-the-line:** Do not change storage policies or bucket in production without backup. No DB schema change for upload tables unless repair.

**Rollback vs fix-forward:** **Fix-forward** for quota increase or config fix. Rollback if recent deploy changed upload/finalize code and uploads broke. Retry failed finalizes only if idempotent and safe.

**Escalation:** If storage is corrupted or quota cannot be increased quickly, escalate.

**Verification after mitigation:** uploads_stuck goes to 0; new upload + finalize succeeds.

---

## 4. Auth / tenant incident

**Symptom pattern:** 401/403 spike; error_captured category auth or tenant_context (log-only); users cannot log in or see projects.

**Probable causes:** Supabase Auth issue; wrong env (NEXT_PUBLIC_SUPABASE_*); session/cookie config broken after deploy; tenant_members data issue.

**Immediate checks:**
1. GET /api/health — auth/db status if exposed.
2. Check Supabase Auth logs and status page.
3. Check recent deploy for auth or env change. Correlation.build_sha in diagnostics.

**Stop-the-line:** Do not change tenant_members or auth config in production without clear cause. Freeze deploys if auth is broken.

**Rollback vs fix-forward:** **Rollback** if deploy introduced auth/config break. **Fix-forward** if Supabase-side or env fix (redeploy with correct env). No DB rollback unless bad auth data written.

**Escalation:** If login is fully broken, escalate immediately; critical severity.

**Verification after mitigation:** Affected users can log in; 401/403 rate drops in logs.

---

## 5. Deploy / post-deploy app failure

**Symptom pattern:** Smoke failed after deploy; health 5xx; critical path (e.g. login, dashboard) broken. correlation.build_sha matches last deploy.

**Probable causes:** Bug in new code; missing env in new deploy; dependency or build issue.

**Immediate checks:**
1. GET /api/v1/admin/ops/diagnostics — correlation; ops_metrics; ai_runtime.error_count; job_failures.
2. GitHub Actions: last deploy run; Cloudflare Dashboard: active deployment.
3. Decide: isolated (one route) vs systemic (whole app).

**Stop-the-line:** **Freeze deploys.** Do not push more code until rollback or fix is decided.

**Rollback vs fix-forward:** **Rollback** (revert + push to main, or workflow_dispatch with previous known-good ref) if systemic and correlated to last deploy. **Fix-forward** if fix is quick and low-risk (e.g. env var). Document decision.

**Escalation:** Escalate when rollback is considered; get second pair of eyes.

**Verification after mitigation:** Smoke passes; health 200; critical path works. Record build_sha of live version.

---

## 6. Config / secrets bad release

**Symptom pattern:** 503 or 500 on routes that need config; env var missing or wrong; feature broken right after deploy.

**Probable causes:** Wrong secret in platform; NEXT_PUBLIC_* or server env not set for new build.

**Immediate checks:**
1. Correlation.build_sha and build_time; compare to deploy log.
2. Check platform (Vercel/CF) env for that env/build. No secrets in logs.
3. Health and diagnostics for which route is failing.

**Stop-the-line:** Do not rotate or add more secrets blindly. Fix the one that is wrong.

**Rollback vs fix-forward:** **Fix-forward:** correct the secret in platform; redeploy (or restart if env is injected at runtime). No DB rollback unless bad data was written due to wrong config.

**Escalation:** If correcting secret requires security review, escalate.

**Verification after mitigation:** Failing route returns 200; no 503 from config.

---

## 7. Unknown / ambiguous incident

**Symptom pattern:** Mixed signals; cannot classify into one type; or new failure mode.

**Probable causes:** Unknown. Need evidence.

**Immediate checks:**
1. Collect full diagnostics JSON (GET /api/v1/admin/ops/diagnostics).
2. Collect correlation (build_sha, build_time, app_env).
3. Note time window of first report and any recent deploy.
4. Share with second responder; do not guess.

**Stop-the-line:** **Freeze deploys** if severity is high or critical. When in doubt, freeze and escalate.

**Rollback vs fix-forward:** **Do not rollback** without evidence that deploy caused the issue. Prefer **monitor and escalate**; gather more data (logs, traces).

**Escalation:** Escalate within 30 minutes if no progress. Document "unknown" and hand off with evidence bundle.

**Verification after mitigation:** Document root cause when found; update runbook if new pattern.
