# Step 17 — Post-Deploy Verification Discipline

## 1. Goal

Formalize what must be checked after deploy, what counts as release-blocking failure, what evidence to record, and when deploy freeze is required. Tighten existing practice (DEPLOY_VERIFY.md, pilot-smoke) rather than replacing.

---

## 2. What must be checked after deploy

| Check | Where | Pass criteria |
|-------|--------|----------------|
| **Deploy step** | GitHub Actions | Deploy step green; Post-deploy summary shows worker name and commit SHA. |
| **Worker live** | Cloudflare Dashboard | Latest deployment Active; time matches deploy. |
| **Health** | GET /api/health | 200; body indicates ok (db, auth if exposed). |
| **Smoke** | pilot-smoke (health, config, cron-tick, ops/metrics) | All smoke steps pass. |
| **Critical path** | Manual | Login and at least one dashboard load (e.g. projects list). |
| **Build identity** | GET /api/v1/ops/metrics or /diagnostics | correlation.build_sha matches deployed commit. |

---

## 3. Release-blocking failure

**Treat as release-blocking (do not consider release complete):**
- Deploy step failed (no new code live; fix and re-run).
- Health returns non-2xx after deploy.
- Smoke failed after deploy (new code is live; treat as post_deploy_app_failure; see runbook).
- Critical path broken (login or dashboard fails) and correlated to this deploy.

**Not release-blocking (can fix forward or monitor):**
- Single route 5xx that recovers; isolated to one tenant; non-critical job type failing. Document and fix in next deploy or hotfix.

---

## 4. Evidence to record

- **After every deploy:** Build SHA (from correlation or CI); deploy timestamp; smoke pass/fail; health pass/fail. Store in CI artifact or ops log (not in app DB).
- **After incident:** Diagnostics JSON (or key fields), build_sha, time window, runbook used, decision (rollback vs fix-forward). Post-mortem doc if severity high/critical.

---

## 5. When deploy freeze is required

- **Freeze:** Critical or high severity incident; post_deploy_app_failure suspected; db_migration_incident; or "when in doubt" per triage model.
- **Unfreeze:** After rollback is live and verified, or after fix-forward is verified and incident closed.
- **No automation in repo:** Freeze is a team rule (e.g. "no push to main until incident resolved"). Document in team runbook.

---

## 6. Relation to rollback / fix-forward

- **Rollback:** Revert + push to main, or workflow_dispatch with previous ref. Verify with DEPLOY_VERIFY steps; confirm correlation.build_sha matches reverted commit after rollback deploy.
- **Fix-forward:** Deploy a new commit that fixes the issue. Verify with same post-deploy checks.
- **Post-deploy discipline** applies to both: after rollback or fix-forward, run the same checks and record evidence.
