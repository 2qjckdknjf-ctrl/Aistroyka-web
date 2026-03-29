# Wave 4 Step 7 — Staging apply (after unblock)

**Date:** 2026-03-29

## E1 — Commands

```bash
cd /Users/alex/Projects/AISTROYKA && bash scripts/release/check-migrations.sh

cd apps/web
supabase migration repair --status reverted 20260325063743 20260325142157 --linked --yes

supabase db push --include-all --dry-run --yes
supabase db push --include-all --yes
```

## E2 — First apply result

**Failed** inside `20260329140000_stakeholder_rls_isolation.sql`:

`ERROR: column "project_id" does not exist` on `worker_reports` policy.

## E3 — Fix

Edited migration SQL: `worker_reports` / `worker_report_media` use `task_id` → `worker_tasks.project_id`; `worker_day` select internal-only.

## E4 — Second apply

```bash
cd apps/web
supabase db push --include-all --yes
```

**Applied:**

- `20260329140000_stakeholder_rls_isolation.sql`  
- `20260329150000_stakeholder_rls_remaining.sql`  
- `20260329160000_stakeholder_rls_identity_export_photo.sql`  

(Earlier batch in the same session had already applied migrations through `20260329130000`.)

## E5 — Post-apply `migration list`

All rows through **`20260329160000`** show **Local | Remote** matched (see audit / validation doc).

## E6 — Environment caveat

Applies to whichever Supabase project was **`supabase link`**’d in `apps/web`. **Confirm** GitHub **staging** `SUPABASE_PROJECT_REF` matches this project before treating as org staging.
