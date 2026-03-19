# Step 17 — Incident Taxonomy and Triage Model

## 1. Incident types (canonical)

| Type | Description | Typical signal |
|------|-------------|----------------|
| **deploy_failure** | Build or deploy step failed; no new code live. | CI red; deploy step failed. |
| **post_deploy_app_failure** | Deploy succeeded but app is broken (5xx, smoke fail, critical path down). | Smoke fail; health 5xx; user reports. |
| **auth_tenant_incident** | Login broken, tenant resolution failing, 401/403 spike. | error_captured auth/tenant_context; 401/403 in logs. |
| **ai_provider_degradation** | One or more AI providers timing out, 503, rate limit. | ai_runtime errors_by_kind: provider_timeout, provider_unavailable, rate_limit. |
| **ai_runtime_failure_cluster** | Many AI requests failing; may be provider or app. | ai_runtime.error_rate_window high; recent_error_sample. |
| **upload_media_failure_cluster** | Uploads stuck, finalize failing, storage errors. | ops_metrics.uploads_stuck; upload_session status. |
| **cron_job_failure** | Background jobs failing or dead; queue stuck. | job_failures.by_type; ops_metrics.jobs_failed. |
| **config_secrets_incident** | Bad env, wrong key, missing secret after deploy. | 503/500 on routes that need config; health may still pass. |
| **db_migration_incident** | Migration failed mid-way or app incompatible with DB. | Migration workflow failed; app 500 on DB access. |
| **unknown_ambiguous** | Cannot yet classify; need more evidence. | Mixed or unclear signals. |

---

## 2. Severity

| Severity | Meaning | Example |
|----------|---------|--------|
| **critical** | Core product down or data at risk. | Health 5xx; login broken; DB unreachable. |
| **high** | Major feature broken; many users affected. | AI all failing; uploads all failing. |
| **medium** | Degraded; one tenant or one provider. | One AI provider down (fallback working); some jobs failing. |
| **low** | Minor; workaround exists. | Single route slow; non-critical job type failing. |

---

## 3. Blast radius

| Radius | Meaning |
|--------|--------|
| **isolated** | One tenant, one job type, one provider, or one route. |
| **systemic** | All tenants, all AI, all uploads, or whole app. |

Use diagnostics: if ai_runtime.error_count is high but one error_kind dominates → possibly isolated to one provider. If jobs_failed is high and one job type → isolated to that job path.

---

## 4. First responder

- **Default:** On-call / platform owner (whoever has deploy and admin access). Document in team runbook; not in repo.
- **Escalation:** When severity is critical or decision is rollback vs fix-forward, involve tech lead or incident commander. Document escalation threshold below.

---

## 5. Fastest safe first action (by type)

| Type | First action |
|------|--------------|
| deploy_failure | No production change. Fix build; re-run. Do not deploy. |
| post_deploy_app_failure | Check diagnostics correlation.build_sha; if correlated, consider rollback (revert + push or dispatch with previous ref). Capture evidence (screenshot, diagnostics JSON). |
| auth_tenant_incident | Check Supabase status; check recent deploy for auth/config change. Do not change DB without cause. |
| ai_provider_degradation | Check ai_runtime.errors_by_kind; if one provider, fallback may be in use. Consider feature-flag disable for AI if all providers failing. |
| ai_runtime_failure_cluster | Open runbook "AI provider degradation" or "AI runtime failure cluster"; collect recent_error_sample and trace_ids. |
| upload_media_failure_cluster | Check storage quota and config; check ops_metrics.uploads_stuck; runbook "Upload/media incident". |
| cron_job_failure | Check job_failures.by_type and last_error; runbook "Job/cron failures". Release stuck jobs if worker crashed. |
| config_secrets_incident | Fix secrets in platform; redeploy. No DB rollback unless bad data written. |
| db_migration_incident | Stop. Do not run more migrations. Assess schema state; may need repair migration or Supabase support / PITR. |
| unknown_ambiguous | Collect diagnostics JSON, build_sha, recent errors; share with second responder; do not rollback without evidence. |

---

## 6. Freeze deploys?

| When to freeze | Rule |
|----------------|------|
| **Yes** | Critical or high severity; post_deploy_app_failure suspected; db_migration_incident. |
| **No** | deploy_failure (nothing went out); isolated medium/low; config fix is a new deploy. |
| **Human judgment** | When cause is unclear; when rollback might make things worse. Document "when in doubt, freeze and escalate." |

---

## 7. Evidence to collect

- **Always:** correlation.build_sha, build_time, app_env; diagnostics response (or at least ops_metrics, ai_runtime.error_count, job_failures.total).
- **AI incidents:** recent_error_sample (trace_id, action, error_kind); errors_by_kind; by_route.
- **Job incidents:** job_failures.recent (id, type, last_error_preview, created_at).
- **Deploy-related:** GitHub Actions run URL; Cloudflare deployment ID; timestamp of deploy.

---

## 8. Escalation threshold

- **Escalate when:** Severity is critical; or rollback is under consideration; or db_migration_incident; or unknown_ambiguous for > 30 minutes without progress.
- **Escalation path:** Document in team runbook (e.g. tech lead, incident commander). Not stored in repo.
