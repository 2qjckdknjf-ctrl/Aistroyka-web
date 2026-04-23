# Wave 0.7 — Production smoke (final)

**Date:** 2026-03-26 (UTC)  
**Host:** macOS — Node on PATH via nvm (see Wave 0.6).

---

## 1. Authoritative entrypoint

| Item | Value |
|------|--------|
| **Script** | `scripts/smoke/pilot_launch.sh` |
| **Base URL** | `BASE_URL=https://www.aistroyka.ai` (fallback from `NEXT_PUBLIC_APP_URL` after sourcing) |

---

## 2. Env-loading method

```bash
set -a
[ -f apps/web/.env.local ] && . apps/web/.env.local
set +a
export BASE_URL="${NEXT_PUBLIC_APP_URL:-https://www.aistroyka.ai}"
bash scripts/smoke/pilot_launch.sh
```

**Secrets:** not printed. **Variable presence** checked without values:

| Variable | Present after source? |
|----------|-------------------------|
| `SMOKE_EMAIL` | **absent** |
| `SMOKE_PASSWORD` | **absent** |
| `NEXT_PUBLIC_SUPABASE_URL` | **absent** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **absent** |
| `AUTH_HEADER` | **absent** |
| `COOKIE` | **absent** |

**Repo fact:** `apps/web/.env.local` exists but is **1 line** (`wc -l`) — **insufficient** for `pilot_launch.sh` to obtain a Bearer token (script requires `SMOKE_EMAIL` + `SMOKE_PASSWORD` + Supabase URL + anon key, or `AUTH_HEADER` / `COOKIE`).

---

## 3. Commands run (exact)

```bash
export PATH="/Users/alex/.nvm/versions/node/v24.14.0/bin:$PATH"
cd /Users/alex/Projects/AISTROYKA
set -a && . apps/web/.env.local && set +a
export BASE_URL="${NEXT_PUBLIC_APP_URL:-https://www.aistroyka.ai}"
bash scripts/smoke/pilot_launch.sh
```

**Exit code:** **1** (script fails on non-200 metrics).

---

## 4. Endpoint results

| Endpoint | HTTP | Result |
|----------|------|--------|
| `GET /api/v1/health` | 200 | **PASS** |
| `GET /api/v1/config` | 200 | **PASS** |
| `POST /api/v1/admin/jobs/cron-tick` | 200 | **PASS** (no secret path) |
| `GET /api/v1/ops/metrics?from=&to=` | **401** | **FAIL** |

---

## 5. `ops/metrics` — 200?

**No.** **HTTP 401** — no auth context (no `AUTH_HEADER`, `COOKIE`, or password-grant inputs).

---

## 6. Exact blocker (if not 200)

1. **`apps/web/.env.local` does not contain** the variables required for smoke to mint a Bearer token (`SMOKE_EMAIL`, `SMOKE_PASSWORD`, `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY` per script), **or** a pre-set `AUTH_HEADER` / `COOKIE`.  
2. **Wave 0.7** cannot invent credentials; **no** secrets are committed.

---

## 7. What operator must do to obtain PASS

1. Populate `apps/web/.env.local` (or export in shell) per `scripts/smoke/pilot_launch.sh` header and `docs/launch/STAGE4_BLOCKER_RESOLUTION_AUTH_AND_PILOT_PREP.md`.  
2. Re-run the same command block.  
3. Expect: `PASS: ops/metrics` and exit **0**.

---

## 8. Wave 0.7 smoke closure conclusion

**Production smoke for `ops/metrics` is NOT closed** on this host — **401** with documented env gap.
