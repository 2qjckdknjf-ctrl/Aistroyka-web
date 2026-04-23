# Wave 0.6 — Smoke proof

**Date:** 2026-03-26 (UTC)

---

## 1. Commands run

| Attempt | Command / env | Result |
|---------|-----------------|--------|
| `pilot_launch` default | `bash scripts/smoke/pilot_launch.sh` | **FAIL** — `localhost:3000` not running (HTTP 000) |
| `pilot_launch` production | `BASE_URL=https://www.aistroyka.ai` + `. apps/web/.env.local` | **PARTIAL PASS** |

---

## 2. Production smoke (with `BASE_URL=https://www.aistroyka.ai`)

**Environment:** `apps/web/.env.local` present; sourced for `NEXT_PUBLIC_*` / Supabase vars. **`SMOKE_EMAIL` not set** in effective env after source (script reported need for auth on metrics).

| Endpoint | Result |
|----------|--------|
| `GET /api/v1/health` | **PASS** |
| `GET /api/v1/config` | **PASS** |
| `POST cron-tick` (no secret path) | **PASS** |
| `GET ops/metrics` | **FAIL** — **HTTP 401** (requires `COOKIE`, `AUTH_HEADER`, or `SMOKE_EMAIL`+`SMOKE_PASSWORD`+Supabase keys) |

---

## 3. Sufficiency for pre-Wave-1 confidence

| Assessment | Detail |
|------------|--------|
| **Public / health path** | **Yes** — production responds. |
| **Tenant-authenticated ops/metrics** | **Not proven** in this run — **401** without smoke credentials. |

**Conclusion:** Smoke is **insufficient** for full “authenticated pilot” confidence until **ops/metrics** passes with a valid Bearer or cookie. **Not** a blocker for **web test** truth (Vitest passed separately).

---

## 4. Exact next step for smoke closure

1. Set `SMOKE_EMAIL`, `SMOKE_PASSWORD`, and Supabase URL/anon key in `.env.local` (or export for one run).  
2. Re-run:  
   `set -a && . apps/web/.env.local && set +a && BASE_URL=https://www.aistroyka.ai bash scripts/smoke/pilot_launch.sh`  
3. Expect **PASS** on `ops/metrics` if tenant membership is valid.

---

## 5. Blockers

| Blocker | Severity |
|---------|----------|
| Local dev server not running | **Expected** for localhost-only attempt |
| Missing `SMOKE_*` in env for this run | **High** for full script green |
