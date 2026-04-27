# Wave 3 — Pilot smoke report

**Date:** 2026-03-28

---

## Command

```bash
cd /path/to/AISTROYKA
set -a; [ -f apps/web/.env.local ] && . apps/web/.env.local; [ -f .env.local ] && . .env.local; set +a
export BASE_URL="${BASE_URL:-https://aistroyka.ai}"
./scripts/smoke/pilot_launch.sh
```

---

## Environment

- **BASE_URL:** `https://aistroyka.ai`
- **Auth:** Password grant via `SMOKE_EMAIL` + `SMOKE_PASSWORD` + Supabase URL/anon key from env (same resolution order as script: `SUPABASE_ANON_KEY` preferred over `NEXT_PUBLIC_*` when both set).

---

## Result

| Step | Result |
|------|--------|
| GET `/api/v1/health` | **PASS** (HTTP 200, `ok`) |
| GET `/api/v1/config` | **PASS** (HTTP 200) |
| POST `/api/v1/admin/jobs/cron-tick` | **PASS** (HTTP 200, no secret) |
| GET `/api/v1/ops/metrics` | **PASS** (HTTP 200, counters returned) |

**Exit code:** `0` — **`pilot_launch done`**

---

## Failure modes observed (debug)

- Without sourcing **both** `apps/web/.env.local` and root `.env.local`, or with wrong anon key order, **`ops/metrics`** can return **401** — operator error, not product regression.
- **Unrelated to Wave 3** code paths: none observed once env matches `pilot_launch` expectations.

---

## Wave 3 relation

- **Smoke** validates **platform health + tenant-scoped metrics** — not the worker proof gate. Worker-specific proof must be verified separately (see live negative report).

---

**Status:** **PASS** (this run).
