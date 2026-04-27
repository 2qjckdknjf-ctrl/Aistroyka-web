# Wave 0.8 — Final Wave 1 unlock (gate recheck)

**Date:** 2026-03-26 (UTC)  
**Mode:** Final gate recheck only — **no** product implementation.

**Latest recheck:** Re-ran authoritative smoke; outcome **unchanged** — **`ops/metrics` → 401**; environment on this host **still** lacks smoke auth vars (see §2).

---

## 1. Authoritative smoke command

```bash
export PATH="/Users/alex/.nvm/versions/node/v24.14.0/bin:$PATH"
cd /Users/alex/Projects/AISTROYKA
set -a
[ -f apps/web/.env.local ] && . apps/web/.env.local
set +a
export BASE_URL="${NEXT_PUBLIC_APP_URL:-https://www.aistroyka.ai}"
bash scripts/smoke/pilot_launch.sh
```

**Script:** `scripts/smoke/pilot_launch.sh` (same as `WAVE07_PRODUCTION_SMOKE_FINAL.md`).

---

## 2. Environment check (names only — no secret values)

| Variable | Present when sourced? |
|----------|------------------------|
| `SMOKE_EMAIL` | **absent** |
| `SMOKE_PASSWORD` | **absent** |
| `NEXT_PUBLIC_SUPABASE_URL` | **absent** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **absent** |
| `SUPABASE_URL` | **absent** |
| `SUPABASE_ANON_KEY` | **absent** |
| `AUTH_HEADER` | **absent** |
| `COOKIE` | **absent** |

**`apps/web/.env.local`:** **1 line** (`wc -l`) — **not** a complete smoke env on this host.

**Conclusion:** Environment is **not** “now-complete” for **`ops/metrics`** authentication.

---

## 3. Endpoint results (production `BASE_URL=https://www.aistroyka.ai`)

| Endpoint | HTTP | Pass? |
|----------|------|-------|
| `GET /api/v1/health` | **200** | **YES** |
| `GET /api/v1/config` | **200** | **YES** |
| `POST /api/v1/admin/jobs/cron-tick` | **200** | **YES** |
| `GET /api/v1/ops/metrics?from=&to=` | **401** | **NO** |

**`ops/metrics`:** **not 200**.

**Exit code:** `pilot_launch.sh` → **1** (failure).

---

## 4. G9 — final signed decision (product-approved, recorded)

**Source of truth:** `docs/release1/G9_PRODUCT_DECISION_APPROVED.md` (**BINDING**).

| Item | Final status |
|------|----------------|
| **Photo proof** | **REQUIRED IN R1** |
| **Text comment** | **DEFERRED WITH APPROVED WAIVER** |
| **Tri-state (done / partial / blocker)** | **DEFERRED WITH APPROVED WAIVER** |
| **Video** | **OUT OF R1** |
| **Voice note** | **OUT OF R1** |

**G9 scope gate:** **SATISFIED** (product decision on file).

---

## 5. Unlock rule (from product + prior waves)

**`WAVE1_APPROVED`** requires **both**:

1. **G9** explicitly approved/waived — **YES** (`G9_PRODUCT_DECISION_APPROVED.md`).
2. **`ops/metrics` = 200** on production smoke — **NO** (this recheck).

---

## 6. Binary decision

# **`WAVE1_BLOCKED`**

**Reason:** **`GET /api/v1/ops/metrics` did not return HTTP 200** — missing auth inputs in the environment used for this run (`401`).

---

## 7. Exact next step to reach `WAVE1_APPROVED`

1. Populate `apps/web/.env.local` (or export) with credentials per `scripts/smoke/pilot_launch.sh` header so the script can set **`Authorization: Bearer …`** or **`Cookie`**.  
2. Re-run the same command block.  
3. When **`PASS: ops/metrics`** and exit **0**, create **`WAVE09` or amend this doc** with **`WAVE1_APPROVED`**.
