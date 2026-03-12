# Release Audit — Phase 10: Operability / SRE / Incident Readiness

**Generated:** Release Readiness Audit

---

## 1. What Can Be Monitored Today

- **Health:** GET /api/health, /api/v1/health (and /api/health/auth for auth check). Return ok, components (Supabase, AI config), build stamp when configured.
- **Smoke scripts:** apps/web/scripts/smoke-prod.sh, smoke-staging.sh, dashboard_smoke.sh; scripts/verify-prod-health.sh, verify-prod-auth.sh. Can be run from CI or manually.
- **Structured logs:** logStructured with event, request_id, route, duration_ms, tenant_id, etc. Suitable for log aggregation.
- **Ops API:** /api/v1/ops/overview, /api/v1/ops/metrics; tenant-scoped. Admin: metrics, SLO, alerts, jobs, audit-logs.
- **Build stamp:** getBuildStamp in config; can expose in health or headers for version visibility.
- **Cron:** cron-tick is a single endpoint; external scheduler (e.g. Cloudflare Cron Triggers) must call it; no built-in cron dashboard in app.

---

## 2. What Cannot Be Monitored Yet

- **No embedded APM:** No Application Performance Monitoring agent observed; rely on Cloudflare Workers analytics and Supabase.
- **No alerting hooks in code:** Alerts (SLO, anomalies) are stored and admin UI; no automatic PagerDuty/Slack push in repo.
- **No canary or A/B deploy:** Single deploy; no canary routing in app.
- **Worker runtime metrics:** Cloudflare dashboard for Workers; not in-app.

---

## 3. Incident Response Blind Spots

- **Cron failures:** If cron-tick fails (e.g. 503), jobs may pile up; no automatic alert unless external monitor hits health/cron.
- **Supabase outage:** Health reflects "Supabase" component; no automatic runbook trigger in repo.
- **AI provider outage:** Logs and usage show failures; no built-in "AI degraded" page or banner.
- **First 72h:** Recommend external uptime check on /api/health and cron endpoint; and log aggregation + alert on 5xx rate.

---

## 4. Minimum Operational Checklist Before Release

- [ ] Health endpoint monitored (e.g. every 1–5 min) with alert on non-200 or "ok: false".
- [ ] Cron-tick scheduled (Cloudflare Cron or equivalent) with CRON_SECRET; alert if cron-tick returns non-2xx.
- [ ] Logs ingested (e.g. Cloudflare Workers logs, or log drain) with search by request_id.
- [ ] Build stamp or version visible (health or header) for deploy verification.
- [ ] Runbook: how to rollback (redeploy previous Worker version); how to disable cron if needed; how to check jobs table and job_events.
- [ ] Env checklist: SUPABASE_*, OPENAI/ANTHROPIC/GEMINI (if used), CRON_SECRET, Stripe webhook secret; DEBUG_* and ENABLE_DIAG_ROUTES off in prod.
- [ ] Storage: Supabase bucket policies and URLs verified for upload and media.
