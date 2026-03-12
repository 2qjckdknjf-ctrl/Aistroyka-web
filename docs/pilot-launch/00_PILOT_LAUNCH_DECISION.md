# Pilot launch decision

**Repo status:** PILOT READY WITH EXTERNAL CONFIG STEPS  
**Pilot launch pack:** Operator-executable runbooks, checklists, and verification scripts in place.

---

## 1. Current launch scope

| Component | In pilot scope | Notes |
|-----------|-----------------|--------|
| **Web** | Yes | Dashboard, projects, tasks, reports, worker flows, admin. |
| **Backend/API** | Yes | All v1 and legacy routes; cron-tick, jobs, billing webhook, AI. |
| **Manager iOS** | Yes | AiStroykaWorker (manager app). Validate against production API. |
| **Worker Lite iOS** | **No** | Excluded. See WORKER_LITE_PILOT_DECISION.md. |

---

## 2. What is launch-ready right now

- **Code and repo:** Build and tests pass; env validation, cron hardening, debug hardening, webhook idempotency, release checker, and pilot go-live script are in place.
- **Docs and scripts:** Operator runbook (01), pilot checklist (02), rollback (03), Cloudflare env matrix, cron trigger examples, Supabase media bucket setup, DB migration sequence, monitoring pack, alerting pack, log search queries, Worker Lite decision, and verification commands.
- **Pilot verification:** `scripts/pilot-go-live-check.mjs` runs health, v1 health, debug blocked, cron-tick with/without secret.

---

## 3. What still needs manual external setup

- **Cloudflare:** Set all required env vars and secrets (see CLOUDFLARE_ENV_MATRIX.md). Set REQUIRE_CRON_SECRET=true and CRON_SECRET.
- **Cron:** Schedule cron-tick (separate Worker or external cron) per CLOUDFLARE_CRON_TRIGGER_EXAMPLES.md.
- **Supabase:** Apply migrations in order (DB_MIGRATION_APPLY_SEQUENCE.md). Configure auth redirect URLs. Create bucket `media` and storage policies (SUPABASE_MEDIA_BUCKET_SETUP.md).
- **Stripe (if used):** Webhook URL and signing secret in env; test event.
- **Monitoring:** External health check (and optional cron check) per MONITORING_SETUP_PACK.md and ALERTING_EXECUTION_PACK.md.
- **Debug:** Ensure DEBUG_AUTH, ENABLE_DIAG_ROUTES not set in production (or ALLOW_DEBUG_HOSTS restricted).

---

## 4. What is excluded from pilot

- **Worker Lite iOS:** Excluded until Xcode is stabilized (dead references removed, build and device smoke passing). See WORKER_LITE_PILOT_DECISION.md and worker-lite-decision-report.md.

---

## 5. Day-of-launch sequence

1. **Pre-launch:** Complete 02_PILOT_LAUNCH_CHECKLIST.md (all “Must have” items). Apply migrations and storage policies if not already done.
2. **Env:** Confirm production env in Cloudflare; run `NODE_ENV=production node scripts/validate-release-env.mjs` (with prod vars); resolve FAIL.
3. **Cron:** Confirm cron-tick is scheduled; run manual curl with CRON_SECRET → 200.
4. **Pilot check:** Run `PILOT_BASE_URL=https://YOUR_APP CRON_SECRET=xxx node scripts/pilot-go-live-check.mjs` → PASS (or accepted PASS_WITH_WARNINGS).
5. **GO/NO-GO:** Sign off on checklist and rollback plan (03_ROLLBACK_AND_RECOVERY.md).
6. **Traffic:** Point domain to deployment (if not already). Enable monitoring/alerting.
7. **First 24h:** Follow FIRST_72H_OPERATIONS_CHECKLIST (docs/release-hardening): health and cron checks; jobs and uploads; rollback triggers.

---

## 6. First-24h monitoring sequence

- **Hourly:** Health GET → 200, ok:true. Cron-tick 2xx if you have a way to check.
- **On alert:** Check Workers and Supabase logs; use LOG_SEARCH_QUERIES.md. If health or auth broken, consider rollback per 03_ROLLBACK_AND_RECOVERY.md.
- **Daily:** Admin → Jobs (failed count); upload session and login sanity.

---

## 7. Rollback triggers

- Health consistently non-200 or ok:false for >5–10 min.
- Auth broken (login/session failing) and fix not quick.
- Data risk (wrong tenant data, corruption).
- Cron/config mistake causing 503/crash; revert deploy and fix env.

See 03_ROLLBACK_AND_RECOVERY.md for steps.

---

## 8. Final decision

**READY AFTER EXTERNAL SETUP**

- **Code and operator pack:** Ready. No remaining code blockers for pilot.
- **Launch:** Can proceed once the external setup (env, cron, Supabase migrations and storage, monitoring) is done and the pilot go-live check passes.
- **Scope:** Web + backend + Manager iOS. Worker Lite excluded.

To reach **READY TO LAUNCH PILOT NOW**, an operator must complete the external setup and run the pilot checklist and go-live script; then the same decision becomes **READY TO LAUNCH PILOT NOW**.
