# Release at Scale

**Phase 9 — Scale Infrastructure**  
**Release safety and rollback at growth.**

---

## CI/CD pipeline reliability

- **Current:** GitHub Actions: CI (apps/web) runs tests; deploy-cloudflare-staging and deploy-cloudflare-prod on push to main (and staging branch). Build: OpenNext + Cloudflare; single job per env; timeout 25 min.
- **Recommendations:**  
  - **Block deploy on CI:** Require test and lint success before deploy job runs (branch protection or workflow dependency).  
  - **Idempotent deploys:** Deploy step should be retryable; avoid partial state.  
  - **Health check after deploy:** Optional step that hits /api/health after deploy; fail job if unhealthy (with retry and rollback option).  
  - **Secrets:** No secrets in logs; use GitHub secrets and Cloudflare secrets; rotate periodically.

---

## Environment promotion flow

- **Current:** Staging and production are separate Cloudflare envs (env.staging, env.production); separate workflows or branches trigger each. No automated “promote staging → prod” in repo.
- **Recommendation:** Define explicit flow: (1) Deploy to staging on merge to staging (or main). (2) Run smoke or sanity on staging. (3) Promote to production: deploy from same commit to prod (manual trigger or approval gate). Never promote without same artifact (commit SHA) that was tested on staging.
- **Document:** Who can promote; how to trigger prod deploy; rollback procedure if prod deploy fails.

---

## Feature flags

- **Current:** No feature-flag system in repo (no LaunchDarkly, Unleash, or env-based flags for features). Some behavior is env-based (e.g. NODE_ENV, NEXT_PUBLIC_APP_ENV).
- **Recommendation:** Introduce simple feature flags (e.g. DB table or env list) for high-risk features: enable per tenant or globally; flip without deploy. Use for: new AI provider, new upload path, experimental UI. Document flag names, owners, and how to flip.
- **Scale:** At scale, use a dedicated flag service with caching to avoid DB read per request.

---

## Canary releases

- **Current:** Single deployment per env; no canary or percentage-based traffic split in repo.
- **Recommendation:** For low-risk changes, full deploy is acceptable. For high-risk (e.g. new job handler, new auth flow), option: (1) Deploy new code behind flag; enable for one tenant or 5% traffic. (2) Monitor error rate and latency for canary. (3) If good, enable for all; if bad, disable and roll back. Implementation can be feature flag + tenant list or platform-level traffic split (Cloudflare Workers routes, or similar). Document when to use canary and how.

---

## Staged rollouts

- **Stages:** (1) Staging deploy + smoke. (2) Production deploy to one region or 10% (if multi-region or percentage available). (3) 50% then 100%. Not implemented in repo; single-region Workers today.
- **Recommendation:** With single deployment, “staged” = deploy to prod, then monitor for 15–30 min; if alerts fire, roll back. When multi-region or traffic split exists, add explicit stages and automation.
- **Document:** Rollout checklist (deploy, monitor, metrics to watch, rollback trigger).

---

## Fast rollback procedure

- **Trigger:** Health check failure after deploy; 5xx spike; p95 breach; or manual decision.
- **Steps:** (1) Revert commit or redeploy previous known-good commit (e.g. last successful prod SHA). (2) Trigger prod deploy workflow with that SHA. (3) Verify health and metrics. (4) Post-incident: root cause and fix forward.
- **Automation:** Optional: “Rollback” button or workflow that deploys previous SHA; store last-good SHA in artifact or env. Document in runbook and INCIDENT_RESPONSE_PLAYBOOK.
- **Data migrations:** If deploy included DB migration, rollback may require backward-compatible migration or data fix; prefer backward-compatible migrations so rollback does not require DB rollback.
