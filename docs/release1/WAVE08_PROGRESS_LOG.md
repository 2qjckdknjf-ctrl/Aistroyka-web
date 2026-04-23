# Wave 0.8 — Progress log (append-only)

---

## 2026-03-26

### Actions

- Re-ran `pilot_launch.sh` after `set -a` / `source apps/web/.env.local` / `set +a`, `BASE_URL=https://www.aistroyka.ai`.
- Confirmed `apps/web/.env.local` line count: **1**.
- Confirmed smoke auth vars: **all absent** (names only logged).
- Results: health/config/cron **PASS**; **ops/metrics 401**; script **exit 1**.

### G9

- Copied authoritative table from `G9_PRODUCT_DECISION_APPROVED.md` into `WAVE08_FINAL_UNLOCK.md`.

### Decision

- **`WAVE1_BLOCKED`** — **ops/metrics ≠ 200**.

### Code / product changes

- **None.**

---

*Append below only.*

---

## 2026-03-26 — Repeat final unlock request

- Re-ran `pilot_launch.sh` (production `BASE_URL`, `source apps/web/.env.local`).
- `.env.local` still **1 line**; `SMOKE_*` / Supabase public keys / `AUTH_HEADER` / `COOKIE` **absent**.
- **ops/metrics** → **401**; script exit **1**.
- Decision: **`WAVE1_BLOCKED`** (unchanged).

