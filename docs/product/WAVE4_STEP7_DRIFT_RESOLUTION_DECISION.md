# Wave 4 Step 7 — Drift resolution decision

**Date:** 2026-03-29  
**Outcome:** **REPAIR_REMOTE_HISTORY** + **BASELINE_OR_ALIGNMENT** (CLI gap fill)

## C1 — Decision

1. **REPAIR_REMOTE_HISTORY** for **`20260325063743`** and **`20260325142157`**  
   - **Rationale:** No matching files in `apps/web/supabase/migrations/`. Safe to remove **history rows** without undoing schema (repair does not roll back DDL). Subsequent repo migrations use **idempotent** `drop policy if exists` / `create policy` where overlapping.  
   - **Risk accepted:** Exact prior DDL of the two versions unknown; schema may include their effects — **superseded** by canonical migrations applied in order.

2. **BASELINE_OR_ALIGNMENT** via **`supabase db push --include-all`**  
   - **Rationale:** Remote had **later** migration `20260326120000` applied while **earlier** repo migrations were absent from history. CLI requires `--include-all` to apply **gap** migrations.

## C2 — Exact commands (staging, executed)

```bash
cd apps/web
supabase migration repair --status reverted 20260325063743 20260325142157 --linked --yes
supabase db push --include-all --dry-run --yes
supabase db push --include-all --yes
```

(Re-run `db push` after fixing `20260329140000` SQL for `worker_reports` / `worker_day`.)

## C3 — What we did **not** do

- No manual edits to `supabase_migrations.schema_migrations` outside CLI.  
- No `migration repair --status applied` for fake versions.  
- No production `db push` in this session.

## C4 — STOP_WITH_BLOCKER

**Not chosen** — staging path completed after SQL fix.
