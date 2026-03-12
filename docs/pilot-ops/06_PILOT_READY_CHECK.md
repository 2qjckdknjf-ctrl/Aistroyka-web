# Phase 6 — One-Command Pilot Readiness Check

**Goal:** Make final verification simple with a single script.

---

## Script

**Path:** `scripts/pilot-ready-check.sh`

**Usage:**

```bash
PILOT_BASE_URL=https://aistroyka.ai CRON_SECRET=your-secret ./scripts/pilot-ready-check.sh
```

Optional: `PILOT_SKIP_CRON=1` to skip the cron-tick check (e.g. when secret is not available in the shell).

---

## What the script checks

1. **Health endpoint** — `GET /api/health` → 200 and body contains `ok: true`.
2. **v1 health** — `GET /api/v1/health` → 200 and body contains `ok: true`.
3. **Cron endpoint** — `POST /api/v1/admin/jobs/cron-tick` with header `x-cron-secret` → 200 and `ok: true`. (Skipped if CRON_SECRET not set or PILOT_SKIP_CRON=1.)
4. **Debug endpoints blocked** — `GET /api/_debug/auth` and `GET /api/diag/supabase` → 404.
5. **Release checker** — If `scripts/validate-release-env.mjs` exists, run it (NODE_ENV=production) and treat FAIL/forbiddenInProd as warning (script runs in same machine; for deployed env, run validation separately with deploy env).

---

## Output verdicts

- **ALL GREEN** — All checks passed, no warnings.
- **WARNINGS** — One or more warnings (e.g. cron skipped, env script issue); exit 0. Acceptable if documented.
- **FAIL** — One or more failures; exit 1. Do not go live until fixed.

---

## Alternative: Node-based check

For a full report with JSON/Markdown output, use the existing pilot go-live script:

```bash
PILOT_BASE_URL=https://aistroyka.ai CRON_SECRET=xxx node scripts/pilot-go-live-check.mjs
```

This writes to `reports/pilot-launch/pilot-go-live-check-<timestamp>.md` and `.json`.

---

## Sample report

See `reports/pilot-ops/pilot-ready-check.sample.md` for an example of the expected output and how to record results.
