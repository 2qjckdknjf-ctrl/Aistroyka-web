# Wave 4 Step 7 — Production dry-run report

**Date:** 2026-03-29  
**Target:** `vthfrxehrursfloevnlp` (AISTROYKA)

## D1 — Command

```bash
cd apps/web
supabase db push --include-all --dry-run --yes
```

## D2 — First attempt note

An earlier attempt in the same session failed with **SASL auth** / **circuit breaker** on the pooler (`cli_login_postgres`). **After** `supabase link` refresh and a short cooldown, the command **succeeded**.

## D3 — Result (authoritative)

```
Remote database is up to date.
```

Exit code: **0**

## D4 — Interpretation

**No** pending migrations relative to `main` at **`fc710fe6`** — Step 7 migrations were **already applied** to this database in the prior staging rollout session (same project).
