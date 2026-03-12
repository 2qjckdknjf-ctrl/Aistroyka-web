# Pilot launch checklist

**Use this on the day of launch.** Check each item; initial and date when done.

---

## Must have (GO-blocking)

- [ ] **ENV** — All required Cloudflare/env vars set (see 01_OPERATOR_RUNBOOK §1). `NODE_ENV=production node scripts/validate-release-env.mjs` → PASS or PASS_WITH_WARNINGS.
- [ ] **DB** — All migrations applied (see DB_MIGRATION_APPLY_SEQUENCE.md). Table `processed_stripe_events` exists.
- [ ] **Auth** — Supabase auth URLs point to production app URL. Login redirect works.
- [ ] **Cron** — CRON_SECRET and REQUIRE_CRON_SECRET=true set. Cron-tick scheduled (every 5–15 min). Manual curl with secret → 200.
- [ ] **Debug** — DEBUG_AUTH, ENABLE_DIAG_ROUTES not set in prod (or ALLOW_DEBUG_HOSTS restricted). GET /api/_debug/auth → 404.
- [ ] **Health** — GET /api/health and GET /api/v1/health → 200, body has "ok": true.
- [ ] **Pilot script** — `PILOT_BASE_URL=... CRON_SECRET=... node scripts/pilot-go-live-check.mjs` → PASS (or accepted WARN).

**Initial:** _________  **Date:** _________

---

## Should have (pilot quality)

- [ ] **Storage** — Bucket `media` exists; INSERT/SELECT policies applied. Upload → finalize → read works.
- [ ] **Stripe** — If using billing: webhook URL and secret set; test event returns 200.
- [ ] **AI** — If using AI: at least one provider key set; analysis does not 503.
- [ ] **Monitoring** — Health check configured (e.g. every 5 min); alert on failure.

**Initial:** _________  **Date:** _________

---

## Nice to have

- [ ] **Push** — APNS/FCM configured if push in pilot scope.
- [ ] **Release check** — `bun run release:check` with prod env → PASS.
- [ ] **Log search** — Log drain or Workers analytics; can search by request_id (see LOG_SEARCH_QUERIES.md).

**Initial:** _________  **Date:** _________

---

## Final GO / NO-GO

- [ ] All “Must have” items checked.
- [ ] Pilot go-live script run and passed (or accepted warnings documented).
- [ ] Rollback plan read (03_ROLLBACK_AND_RECOVERY.md).

**Decision:** GO / NO-GO  
**Signed:** _________  **Date:** _________
