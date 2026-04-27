# Wave 0.7 — Progress log (append-only)

---

## 2026-03-26

### Production smoke

- `wc -l apps/web/.env.local` → **1 line** (no secret values logged).
- Sourced `apps/web/.env.local`; checked presence of `SMOKE_EMAIL`, `SMOKE_PASSWORD`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `AUTH_HEADER`, `COOKIE` → **all absent** after source (file too minimal).
- Ran `BASE_URL=https://www.aistroyka.ai bash scripts/smoke/pilot_launch.sh` after `set -a` / `source` — health/config/cron **PASS**, **ops/metrics 401**, exit **1**.

### G9

- No human signatures collected — **G9 not closed**.

### Assumptions

- Operator machine may have fuller `.env.local` elsewhere; **this** repo checkout’s `.env.local` is **insufficient** for metrics auth.

### Fixes

- **None** product code; **no** workflow changes in Wave 0.7.

---

*Append below only.*

---

## 2026-03-26 — G9 product approval (user directive)

- Recorded **`docs/release1/G9_PRODUCT_DECISION_APPROVED.md`** — binding G9 table + reason.
- Amended **`WAVE07_WAVE1_FINAL_DECISION.md`** §9 — G9 **closed**; **`WAVE1_BLOCKED`** remains until **`ops/metrics` → 200**.
- Updated **`WAVE07_G9_FINAL_SIGNOFF.md`** — points to canonical G9 file.

