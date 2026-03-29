# Wave 4 Step 7 — Staging drift audit

**Date:** 2026-03-29  
**Target:** Supabase project linked from `apps/web` at time of run (**operator must confirm** this ref is **staging**, not prod/dev).

## B1 — `supabase migration list` (before repair)

### Remote-only (no local file)

| Version | Interpretation |
|---------|------------------|
| `20260325063743` | Non-repo migration recorded on remote (timestamp style from CLI/dashboard). |
| `20260325142157` | Same. |

**Repo** has canonical `20260325160000_worker_rls_include_tenant_owners.sql` **not** applied on remote at audit time.

### Local-only (not on remote) — gap before `20260326120000`

Migrations `20260323000000` … `20260323140000` existed locally but were **missing** from remote history while **`20260326120000`** was **already** applied on remote — **ordering gap**.

### Both — after full rollout

See post-apply `migration list`: all local files through `20260329160000` show **Local | Remote** aligned.

## B2 — Likely mapping for remote-only versions

| Remote-only | Likely meaning |
|-------------|----------------|
| `20260325063743` / `20260325142157` | Ad-hoc or split applies on 2026-03-25; **not** present in git. **Not** superseded by filename match; **superseded in effect** by repo sequence once `20260325160000` + later migrations apply (worker RLS uses idempotent `drop policy if exists`). |

**Ambiguity before repair:** Exact SQL of remote-only versions **not** retrieved (no dashboard SQL log in this sprint).

## B3 — `supabase db push --dry-run` (before repair)

Failed with: `Remote migration versions not found in local migrations directory` (blocker).

## B4 — `supabase db push --dry-run` (after repair, before first full apply)

With `--include-all`: listed gap migrations `20260323000000` … `20260325160000`, then `20260328120000` … `20260329160000`.

## B5 — First apply failure (SQL)

`20260329140000_stakeholder_rls_isolation.sql` failed: **`worker_reports` has no column `project_id`**. Policies incorrectly referenced `project_id` on `worker_reports` / `worker_report_media` / `worker_day`.

**Fix applied in repo:** `worker_reports` / `worker_report_media` use `task_id` → `worker_tasks.project_id`; `worker_day` internal-only read (no `project_id` on table).

## Ambiguity remaining after audit

**NO** for **blocking** further staging work — repair + `--include-all` + corrected SQL produced a successful apply.

**YES** for **historical** exact SQL of `20260325063743` / `20260325142157` — not recovered; **repair reverted** history only (schema unchanged).
