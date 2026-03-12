# Release Audit — First 72 Hours Release Plan

**Generated:** Release Readiness Audit

---

## 1. Monitor every hour (first 24h)

- **Health:** GET /api/health and /api/v1/health — expect 200 and `ok: true`. Alert on 5xx or `ok: false`.
- **Cron:** If cron-tick is called every 5–15 min, verify 2xx. Alert on consecutive failures.
- **Error rate:** 5xx count per hour (from Workers or log drain). Alert if above threshold (e.g. >1% or >N).

---

## 2. Monitor daily

- **Jobs:** Count jobs in status queued/running/failed/dead per tenant. Investigate if failed or dead grows.
- **Upload sessions:** Count expired or stuck (created but not finalized). Compare with upload_reconcile runs.
- **Auth:** Login and session refresh success rate if measurable.
- **AI:** Usage rows and failure rate from logs or ai_usage table.

---

## 3. Smoke commands

- **Health:** `curl -sS https://<host>/api/health`
- **Auth (if smoke script):** Run apps/web/scripts/smoke-prod.sh or verify-prod-auth.sh per docs.
- **Dashboard:** Run dashboard_smoke.sh if available and env allows.

---

## 4. Critical dashboards / metrics

- Cloudflare Workers: requests, errors, CPU time.
- Supabase: connections, API usage, storage.
- Application: /api/v1/ops/overview and /api/v1/ops/metrics (tenant-scoped; use admin or test tenant).
- Logs: search by request_id for failed requests.

---

## 5. Rollback triggers

- **Rollback deploy** if: error rate >X% for >15 min; health consistently failing; data corruption suspected.
- **Pause cron** if: cron-tick causes errors or overload; then fix and re-enable.
- **Disable feature** (e.g. AI) via feature flag or config if AI provider is down and causing 503s.

---

## 6. Incident priorities

1. **P0:** Site down (health failing); auth broken; data loss or corruption.
2. **P1:** Cron not running; jobs stuck; uploads failing; AI consistently failing.
3. **P2:** Single-tenant issues; slow response; non-critical feature broken.
4. **P3:** Cosmetic; missing translations; minor UX.

---

## 7. Contacts and runbooks

- Ensure runbooks (rollback, cron, env, jobs) are linked from ops doc or dashboard.
- Define on-call or escalation for P0/P1 in first 72h.
