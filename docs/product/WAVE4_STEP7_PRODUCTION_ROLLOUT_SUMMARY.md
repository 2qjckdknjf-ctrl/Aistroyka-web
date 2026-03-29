# Wave 4 Step 7 — Production rollout summary

**Date:** 2026-03-29

## What completed

1. **Git:** Rollout bundle committed **`fc710fe6`** and **pushed** to **`origin/main`**.
2. **Target:** **AISTROYKA** Supabase project **`vthfrxehrursfloevnlp`** (active; same DB used for prior successful `db push` in blocker sprint).
3. **Preflight:** `migration list` — Step 7 versions **on remote**.
4. **Dry-run:** `supabase db push --include-all --dry-run --yes` → **Remote database is up to date** (after one transient auth failure, succeeded on retry).
5. **Apply:** `supabase db push --include-all --yes` → **up to date** (no pending migrations).
6. **Other project:** **HiProject** `dqtvxmqyrkxnptqswwyh` — **paused**; link **blocked**.

## Truthful verdict

- **AISTROYKA production (this app’s DB):** Step 7 migrations **are** applied; CLI **confirms** nothing left to push at `fc710fe6`.
- **Strict “verification”:** Migration history **proven**; **dashboard SQL** for legacy count and `pg_proc` **not** run in this session.

## Docs

See `WAVE4_STEP7_PRODUCTION_*.md` in `docs/product/` for evidence tables.
