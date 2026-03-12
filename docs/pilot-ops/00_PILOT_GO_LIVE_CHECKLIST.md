# Pilot go-live checklist

**Use this as the master checklist for moving from “pilot ready with external config steps” to “pilot ready (operations complete)”.**

---

## SECTION A — PREPARE

- [ ] **Set env** — All CORE and CRON variables set in Cloudflare (production). See [01_PRODUCTION_ENV_SETUP.md](01_PRODUCTION_ENV_SETUP.md). No DEBUG_* or ENABLE_DIAG_ROUTES in production.
- [ ] **Deploy** — Worker deployed (e.g. `wrangler deploy --env production`). Build and deploy pipeline successful.
- [ ] **Apply migrations** — All Supabase migrations applied (including Stripe idempotency if using billing). See [04_STRIPE_MIGRATION_APPLY.md](04_STRIPE_MIGRATION_APPLY.md).

---

## SECTION B — ACTIVATE

- [ ] **Enable cron** — Cloudflare Cron Trigger (or external cron) configured to POST `/api/v1/admin/jobs/cron-tick` with header `x-cron-secret`. See [02_CRON_PRODUCTION_SETUP.md](02_CRON_PRODUCTION_SETUP.md).
- [ ] **Verify storage** — Bucket `media` exists in Supabase; policies for tenant isolation applied. See [03_SUPABASE_STORAGE_SETUP.md](03_SUPABASE_STORAGE_SETUP.md). Test upload and access.
- [ ] **Verify billing** — If using Stripe: webhook URL set, `STRIPE_WEBHOOK_SECRET` in env, migration `20260306900000_stripe_webhook_idempotency.sql` applied. See [04_STRIPE_MIGRATION_APPLY.md](04_STRIPE_MIGRATION_APPLY.md).

---

## SECTION C — VERIFY

- [ ] **Health OK** — `curl https://<your-domain>/api/health` returns 200 and body has `ok: true`, `db: ok`.
- [ ] **Jobs running** — Cron-tick with secret returns 200 and `ok: true`. Without secret returns 403 or 503. See [02_CRON_PRODUCTION_SETUP.md](02_CRON_PRODUCTION_SETUP.md) and [reports/pilot-ops/cron-verification.md](../../reports/pilot-ops/cron-verification.md).
- [ ] **Upload works** — Create upload session, upload file to `media/{tenant_id}/{session_id}/`, finalize; media appears and is accessible. See [03_SUPABASE_STORAGE_SETUP.md](03_SUPABASE_STORAGE_SETUP.md).
- [ ] **AI works** — If AI is enabled: analyze-image or job-driven analysis completes (optional for minimal pilot).

---

## SECTION D — LAUNCH

- [ ] **Pilot users enabled** — Target pilot users/tenants have access; invites or onboarding done.
- [ ] **Monitoring on** — Health and cron monitored; alerts configured if available. Run [06_PILOT_READY_CHECK.md](06_PILOT_READY_CHECK.md) (or `scripts/pilot-ready-check.sh`) and keep report.

---

## One-command verification

Before go-live, run:

```bash
PILOT_BASE_URL=https://aistroyka.ai CRON_SECRET=*** ./scripts/pilot-ready-check.sh
```

Expect **ALL GREEN** or **WARNINGS** (with reasons documented). Resolve any **FAIL** before launch.

---

## Production safety (must pass)

- [ ] `GET /api/_debug/auth` → **404**. See [05_PRODUCTION_SAFETY_CHECKS.md](05_PRODUCTION_SAFETY_CHECKS.md).
- [ ] `GET /api/diag/supabase` → **404**.
