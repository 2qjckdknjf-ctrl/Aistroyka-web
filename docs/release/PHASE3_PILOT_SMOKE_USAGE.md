# Phase 3 Pilot Smoke Usage — AISTROYKA

**Date:** 2026-03-14

---

## 1. Exact Command to Run

```bash
BASE_URL=https://aistroyka.ai npm run smoke:pilot
```

Or directly:

```bash
BASE_URL=https://aistroyka.ai bash scripts/smoke/pilot_launch.sh
```

---

## 2. Required Env Vars

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| BASE_URL | No | http://localhost:3000 | Target base URL (no trailing slash) |
| CRON_SECRET | No | — | Set when REQUIRE_CRON_SECRET=true on server; enables cron-tick check |
| AUTH_HEADER | No | — | Bearer token for ops/metrics (tenant-scoped) |
| COOKIE | No | — | Session cookie for ops/metrics (alternative to AUTH_HEADER) |
| SMOKE_EMAIL, SMOKE_PASSWORD | No | — | Optional: auto-obtain token for ops/metrics if SUPABASE_URL + SUPABASE_ANON_KEY set |

---

## 3. Endpoints Checked

| Endpoint | Method | Auth | Notes |
|----------|--------|------|-------|
| /api/v1/health | GET | None | Must return 200 or 503 with `"ok"` in body |
| /api/v1/admin/jobs/cron-tick | POST | x-cron-secret (optional) | Pilot-critical; 403 if CRON_SECRET required but not set |
| /api/v1/ops/metrics | GET | Cookie or Authorization | Tenant-scoped; requires auth for 200 |

---

## 4. Expected Output (Success)

```
Pilot launch smoke: https://aistroyka.ai (from=2026-03-07 to=2026-03-14)
  PASS: health
  PASS: cron-tick
  PASS: ops/metrics
  Counters: uploads_stuck=... uploads_expired=... ...
  pilot_launch done
```

---

## 5. What to Do on Failure

| Failure | Action |
|---------|--------|
| FAIL: health → HTTP 5xx/4xx | Check app is running; check Cloudflare Workers / domain routing |
| FAIL: cron-tick 403 | Set CRON_SECRET when REQUIRE_CRON_SECRET=true |
| FAIL: ops/metrics → HTTP 401/403 | Set COOKIE or AUTH_HEADER for tenant auth |
| Script exits 1 | At least one check failed; fix the failing endpoint before considering release complete |

---

## 6. Local / Staging

```bash
BASE_URL=http://localhost:3000 npm run smoke:pilot
BASE_URL=https://staging.aistroyka.ai npm run smoke:pilot
```

---

## 7. Script Location

- **Canonical:** `scripts/smoke/pilot_launch.sh` (repo root)
- **npm script:** `npm run smoke:pilot` → invokes above
