# Step 17 — Incident Readiness Summary

## What incident-readiness capability is now real

- **Incident inventory:** Documented what exists (Step 16 diagnostics, observability, rollback reality, playbooks) and the main gaps (triage, runbooks tied to diagnostics, alert routing, freeze/escalation rules). See STEP17_INCIDENT_INVENTORY.md.
- **Incident taxonomy and triage:** Canonical types (deploy_failure, post_deploy_app_failure, auth_tenant, ai_provider_degradation, ai_runtime_failure_cluster, upload_media, cron_job_failure, config_secrets, db_migration, unknown_ambiguous). For each: severity, blast radius, first action, freeze deploys?, evidence, escalation. Operators can classify and choose a first action. See STEP17_INCIDENT_TRIAGE_MODEL.md.
- **Runbooks:** Seven operator runbooks (AI provider degradation, job/cron failures, upload/media, auth/tenant, deploy/post-deploy app failure, config/secrets, unknown/ambiguous). Each has symptom pattern, immediate checks, stop-the-line rules, rollback vs fix-forward, escalation, verification. See STEP17_RUNBOOKS.md.
- **Alert policies:** Alert-worthy classes, severity, page vs warn, threshold examples, correlation with diagnostics, operator hints per class. Routing assumptions documented (no transport in repo). See STEP17_ALERT_POLICIES.md.
- **AI provider health:** Diagnostics response includes **errors_by_provider** (from audit details.provider). **incident_hints** suggest "ai_provider" and "ai_runtime_failure_cluster" when relevant. See STEP17_PROVIDER_HEALTH_MODEL.md.
- **Job/cron visibility:** Documented; diagnostics has job_failures.by_type and recent. **incident_hints** add "cron_job_failure" with dominant type and runbook ref. See STEP17_JOB_FAILURE_VISIBILITY.md.
- **Post-deploy discipline:** What to check after deploy, what is release-blocking, what evidence to record, when to freeze deploys. Aligned with DEPLOY_VERIFY and rollback reality. See STEP17_POST_DEPLOY_DISCIPLINE.md.
- **Operator surfaces:** GET /api/v1/admin/ops/diagnostics returns errors_by_provider, incident_hints (array or null), and operator_hints.runbooks (path to STEP17 docs). One call gives "what is failing, which build, and which runbook to use." Incident-hint logic is in lib/ops/incident-hints.ts and covered by lib/ops/incident-hints.test.ts.

## What remains partial and why

- **Alert transport:** Not in repo; documented as external (e.g. polling script + Slack). Thresholds are doc-only.
- **Escalation path:** "Who to escalate to" is team-specific; documented as "document in team runbook."
- **Automated freeze:** No CI gate that blocks deploy during incident; freeze is a process rule.

## Next major step allowed

**Yes.** Step 17 is closed. The system is incident-ready: operators have triage, runbooks, alert policy docs, provider and job visibility in diagnostics, post-deploy discipline, and incident hints that point to runbooks. Proceeding to Step 18 (or next planned step) is allowed.

## Exact blockers (if any)

None.
