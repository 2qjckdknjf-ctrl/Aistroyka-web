# Wave 0.7 — Wave 1 final binary decision

**Date:** 2026-03-26 (UTC)

---

## 1. Decision

| Field | Value |
|-------|--------|
| **Final binary decision** | **`WAVE1_BLOCKED`** |

---

## 2. Evidence summary

| Evidence | Result |
|----------|--------|
| **Web Vitest (Wave 0.6)** | **PASS** — full suite green (1106 tests) |
| **Production smoke** (`pilot_launch.sh` + `BASE_URL=https://www.aistroyka.ai`) | **PARTIAL** — health, config, cron **PASS**; **`ops/metrics` → 401** |

**Wave 0.7 smoke re-run:** `docs/release1/WAVE07_PRODUCTION_SMOKE_FINAL.md` — **`ops/metrics` not 200** (env lacks smoke credentials on this host).

---

## 3. Passed gates

- Web automated tests (host-backed, Wave 0.6).  
- **Unauthenticated** production health/config/cron paths for `www.aistroyka.ai`.

---

## 4. Failed gates

| Gate | Failure |
|------|---------|
| **Smoke — tenant ops/metrics** | **401** — no Bearer/cookie/password grant inputs available in loaded env |
| **G9** | **Not closed** — **no** signed waivers for deferred items; **no** product signature |

---

## 5. Accepted waivers

**None** on file.

---

## 6. Remaining blockers (must clear for `WAVE1_APPROVED`)

1. **Populate** `.env.local` (or CI secrets) with `SMOKE_EMAIL`, `SMOKE_PASSWORD`, Supabase URL + anon key — **or** export `AUTH_HEADER` — and re-run `pilot_launch.sh` until **`ops/metrics` → 200**.  
2. **Product** signs **G9** (`WAVE07_G9_FINAL_SIGNOFF.md`) or provides **waivers** for **text comment** and **tri-state** if they remain deferred.

---

## 7. Exact next step

1. Operator fills `apps/web/.env.local` per `scripts/smoke/pilot_launch.sh` header (never commit).  
2. Re-run smoke; capture **PASS** on **ops/metrics**.  
3. Product signs G9 waiver or upgrades scope.  
4. Re-issue **`WAVE1_APPROVED`** in a new one-line decision doc.

---

## 8. Binary rule

| Value | Meaning |
|-------|---------|
| **WAVE1_APPROVED** | **Not issued** |
| **WAVE1_BLOCKED** | **Current** |

---

## 9. Amendment — G9 product approval (2026-03-26)

**G9 scope is closed** by binding product decision: **`docs/release1/G9_PRODUCT_DECISION_APPROVED.md`**.

| Prior blocker | Status after amendment |
|---------------|-------------------------|
| G9 product sign-off / waivers | **CLOSED** — text comment + tri-state **DEFERRED WITH APPROVED WAIVER**; video/voice **OUT OF R1**; photo **REQUIRED IN R1** |

**Remaining gate for `WAVE1_APPROVED`:** **`ops/metrics` → HTTP 200** on production smoke (`pilot_launch.sh`) — unchanged until proven.

**Supersedes:** §4–5–6 of this document for **G9** items only; smoke evidence remains as recorded in `WAVE07_PRODUCTION_SMOKE_FINAL.md` until updated.
