# Step 13 Migration Reconciliation — Inventory

**Date:** 2025-03-14  
**Mission:** Production migration reconciliation + Step 13 cost layer activation

---

## A1. Local Migration List

Local migrations live in `apps/web/supabase/migrations/`. Total: **53 migrations**.

| Version | Name |
|---------|------|
| 20260303000000 | base_tenants_projects |
| 20260304000000 | rate_limit_slots |
| 20260304000100 | ai_usage_and_billing |
| 20260304000200 | tenants_plan |
| 20260304000300 | worker_lite |
| 20260304000400 | upload_sessions |
| 20260305000000 | jobs |
| ... | (45 more) |
| 20260307200000 | project_milestones |
| 20260307300000 | report_reject_semantics |
| 20260307400000 | project_documents |
| **20260307500000** | **project_cost_items** ← Step 13 |

**Step 13 migration:** `20260307500000_project_cost_items.sql`  
**Dependency:** `project_cost_items` references `project_milestones(id)` for `milestone_id` FK.

---

## A2. Remote Migration History

Queried via `user-supabase` MCP `execute_sql` on `supabase_migrations.schema_migrations`:

| Version | Name (from list_migrations) |
|---------|-----------------------------|
| 20260311181941 | stripe_webhook_idempotency |

**Remote has exactly 1 migration record.**

---

## A3. Remote Schema (Tables)

Queried `information_schema.tables` for `public` schema:

| Table |
|-------|
| ai_analysis |
| ai_cost_events |
| analysis_jobs |
| billing_snapshots |
| job_events |
| job_sweep_log |
| media |
| payments |
| plans |
| pricing_rules |
| processed_stripe_events |
| projects |
| region_capacity |
| regions |
| system_capacity |
| tenant_members |
| tenants |
| usage_events |
| worker_heartbeat |
| workers |

**Missing for Step 13:**
- `project_milestones` — **does not exist**
- `project_cost_items` — **does not exist**
- `worker_tasks` — **does not exist** (required by project_milestones migration for `milestone_id` column)

---

## A4. Discrepancies

| Category | Details |
|----------|---------|
| **Local only** | 52 of 53 migrations (all except stripe_webhook_idempotency, which exists under different version) |
| **Remote only** | 20260311181941 (version differs from local 20260306900000) |
| **Mismatched** | Remote stripe_webhook_idempotency version 20260311181941 vs local 20260306900000 |
| **Schema drift** | Remote schema is from a different migration path; table names (ai_analysis, analysis_jobs, etc.) do not match our migration stack |
| **Step 13 blockers** | `project_milestones` and `project_cost_items` do not exist; `worker_tasks` does not exist |

---

## A5. Root-Cause Hypothesis

1. **Different schema lineage:** Remote DB was provisioned or evolved via a different path (Supabase dashboard, different migration runner, or template).
2. **Migration history minimal:** Only one migration recorded; schema objects exist without corresponding migration rows.
3. **Version mismatch:** Remote stripe_webhook_idempotency uses version 20260311181941; local uses 20260306900000.
4. **Blind replay risk:** Running all 53 local migrations would fail on existing objects (e.g. RLS policies, tables) and is explicitly forbidden.

---

## Summary

- **Local:** 53 migrations; Step 13 = `20260307500000_project_cost_items.sql`
- **Remote:** 1 migration in history; schema has tenants/projects but not project_milestones, project_cost_items, or worker_tasks
- **Drift:** Severe; remote schema does not follow local migration stack
- **Safe path:** Apply only the minimal schema required for Step 13: project_milestones + project_cost_items, with conditional handling for missing worker_tasks
