# Pilot verification commands

**Purpose:** Single place for all post-deploy verification commands.

---

## One-command pilot check (recommended)

From repo root, with production URL and cron secret:

```bash
PILOT_BASE_URL=https://YOUR_APP CRON_SECRET=your_cron_secret node scripts/pilot-go-live-check.mjs
```

- **PILOT_BASE_URL** — Base URL of the deployed app (no trailing slash). Example: `https://aistroyka.ai`.
- **CRON_SECRET** — Same value as in Cloudflare. Omit or set **PILOT_SKIP_CRON=1** to skip cron-tick check (script will WARN).

**Output:** PASS / PASS_WITH_WARNINGS / FAIL. Reports written to `reports/pilot-launch/pilot-go-live-check-<timestamp>.md` and `.json`.

**Interpretation:**
- **PASS** — Go live OK.
- **PASS_WITH_WARNINGS** — OK if warnings are accepted (e.g. cron skipped because secret not in env).
- **FAIL** — Fix failing checks before pilot.

---

## Individual checks (manual)

```bash
# Health
curl -sS "https://YOUR_APP/api/health" | jq .
curl -sS "https://YOUR_APP/api/v1/health" | jq .

# Debug blocked (expect 404)
curl -sS -o /dev/null -w "%{http_code}" "https://YOUR_APP/api/_debug/auth"
curl -sS -o /dev/null -w "%{http_code}" "https://YOUR_APP/api/diag/supabase"

# Cron-tick with secret (expect 200)
curl -sS -X POST -H "x-cron-secret: $CRON_SECRET" "https://YOUR_APP/api/v1/admin/jobs/cron-tick" | jq .

# Cron-tick without secret (expect 403 or 503)
curl -sS -o /dev/null -w "%{http_code}" -X POST "https://YOUR_APP/api/v1/admin/jobs/cron-tick"
```

---

## Env and release checker (with production vars)

Run with production env loaded (e.g. in CI or after sourcing):

```bash
NODE_ENV=production node scripts/validate-release-env.mjs
bun run release:check
```

---

## Existing smoke scripts

- **apps/web/scripts/smoke-prod.sh** — Health only. Usage: `./apps/web/scripts/smoke-prod.sh https://YOUR_APP` or set SMOKE_BASE_URL.
- **scripts/verify-cron-hardening.sh** — Cron blocking (no secret). Set CRON_TICK_URL to your app. Does not test with valid secret.

The **pilot-go-live-check.mjs** script unifies health, v1 health, debug blocked, cron with secret, and cron blocked in one run.
