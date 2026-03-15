# Step 13 Migration Repair Strategy

**Date:** 2025-03-14

---

## B1. Chosen Strategy

**Targeted application of Step 13 schema only** — create `project_milestones` and `project_cost_items` via a single reconciliation migration, with conditional handling for missing `worker_tasks`.

---

## B2. Why This Is Safer Than Blind Replay

| Approach | Risk |
|----------|------|
| **Blind replay of all 53 migrations** | Fails on existing objects (RLS, tables); violates mission rule |
| **supabase db push** | Would attempt migrations not in remote history; remote schema differs from local stack |
| **Targeted Step 13 only** | Applies only what is missing; no mutation of existing objects |

---

## B3. Migrations to Mark as Applied

**None.** Remote history has only `20260311181941`. We are not repairing old version numbers; we are adding new schema.

---

## B4. Migrations to Actually Run

A single reconciliation migration that:

1. **Creates `project_milestones`** — table, indexes, RLS, policy (from `20260307200000_project_milestones.sql`)
2. **Conditionally alters `worker_tasks`** — only if `worker_tasks` exists (add `milestone_id` column)
3. **Creates `project_cost_items`** — table, indexes, RLS, policy, trigger (from `20260307500000_project_cost_items.sql`)

---

## B5. Rationale

- `project_cost_items` has FK `milestone_id references project_milestones(id)` — `project_milestones` must exist first.
- Original `project_milestones` migration alters `worker_tasks`; remote has no `worker_tasks` — we wrap that in `IF EXISTS`.
- No other migrations are required for Step 13 cost layer.
- Uses `create table if not exists`, `create index if not exists`, `create or replace function` to be idempotent where possible.

---

## B6. Official Supabase-Safe Path

- Use MCP `apply_migration` (or equivalent) to apply the reconciliation SQL.
- This records the migration in `supabase_migrations.schema_migrations`.
- No `supabase migration repair` needed — we are adding, not repairing existing rows.
