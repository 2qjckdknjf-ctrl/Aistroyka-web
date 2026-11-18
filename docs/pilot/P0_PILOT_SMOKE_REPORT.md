# P0 — Pilot Smoke Report

**Date:** 2026-07-01  
**Script:** `scripts/smoke/pilot_launch.sh`  
**Preflight:** `bun run smoke:pilot:check` / `scripts/smoke/check_pilot_prereqs.sh`

---

## Command

```bash
# From repo root with .env.local loaded (SMOKE_EMAIL/PASSWORD + Supabase public keys)
set -a && source .env.local && set +a
BASE_URL=https://aistroyka.ai bash scripts/smoke/pilot_launch.sh
```

Optional full pass including cron:

```bash
CRON_SECRET="<from Cloudflare dashboard>" BASE_URL=https://aistroyka.ai bash scripts/smoke/pilot_launch.sh
```

---

## Endpoints checked

| # | Route | Auth | Production result |
|---|-------|------|-------------------|
| 0 | `GET /api/v1/health` | none | **PASS** HTTP 200, `ok=true`, `db=ok` |
| 0b | `GET /api/v1/config` | none | **PASS** HTTP 200 |
| 1 | `POST /api/v1/admin/jobs/cron-tick` | `x-cron-secret` when set | **FAIL** HTTP 403 without secret (expected fail-closed) |
| 2 | `GET /api/v1/ops/metrics?from=&to=` | Bearer user JWT | **PASS** HTTP 200 |

Metrics counters (2026-07-01): uploads_stuck=0, uploads_expired=0, devices_offline=2, sync_conflicts=0.

---

## Exit behavior

- Non-zero exit if any **required** check fails  
- **2026-07-01 production run:** exit **1** due to cron-tick 403 (no `CRON_SECRET` in local env)  
- Critical pilot paths (health, config, tenant metrics) **PASS**

---

## Required env

| Variable | Required for |
|----------|--------------|
| `BASE_URL` | Target host |
| `SMOKE_EMAIL` + `SMOKE_PASSWORD` + Supabase URL/anon | ops/metrics JWT mint |
| `CRON_SECRET` | cron-tick full pass |
| `AUTH_HEADER` or `COOKIE` | Alternative metrics auth |

---

## Verdict

**PARTIAL** — one-command smoke proves live health, worker config bootstrap, and tenant metrics on production. Cron path blocked locally by missing secret (security-correct on production). **Not a product blocker** if cron is intentionally secret-gated; document operator command with `CRON_SECRET` for FULL smoke pass.
