# Step 13 Migration Governance Safeguards

**Date:** 2025-03-14

---

## F1. Correct Migration Path (Do This)

| Step | Action |
|------|--------|
| 1 | Inspect remote migration history: `supabase migration list` or query `supabase_migrations.schema_migrations` |
| 2 | Compare local vs remote; identify drift |
| 3 | If drift: use `supabase migration repair` to mark applied/reverted as needed |
| 4 | Apply only missing migrations: `supabase db push` (or MCP `apply_migration` for targeted migrations) |
| 5 | Verify schema: `SELECT EXISTS (... FROM information_schema.tables WHERE table_name = 'project_cost_items')` |

---

## F2. Do NOT Do This

| Anti-pattern | Why |
|--------------|-----|
| **Blind replay of all 53 migrations** | Fails on existing objects (RLS, tables); violates mission rule |
| **Custom runner that replays entire stack** | Same as above; no drift awareness |
| **Assuming remote is empty** | Remote may have schema from dashboard, different runner, or template |
| **Skipping migration history inspection** | Drift unknown; wrong migrations may be applied or skipped |

---

## F3. Runbook / Checklist Updates

**Pre-deploy checklist** (add to `docs/pilot-launch/DB_MIGRATION_APPLY_SEQUENCE.md` or equivalent):

- [ ] Run `supabase migration list` (or equivalent) to compare local vs remote
- [ ] If drift: repair history before applying new migrations
- [ ] Apply only migrations not present in remote history
- [ ] Verify `project_cost_items` exists if using cost features

---

## F4. Step 13 Closure Reference

**Docs:** `docs/db/STEP13_MIGRATION_RECONCILIATION_INVENTORY.md`, `STEP13_MIGRATION_REPAIR_STRATEGY.md`, `STEP13_MIGRATION_RECONCILIATION_EXECUTION.md`, `STEP13_LIVE_SCHEMA_VERIFICATION.md`, `STEP13_LIVE_RUNTIME_AFTER_RECONCILIATION.md`, `STEP13_FINAL_MIGRATION_AUDIT.md`, `STEP13_FINAL_MIGRATION_SUMMARY.md`

**Migration applied:** `project_cost_items_step13_reconciliation` (version 20260314215938) — creates `project_milestones` + `project_cost_items`.

---

## F5. Scripts / Checks

- **Existing:** `apps/web/scripts/verify-cost-migration.mjs` — checks `project_cost_items` exists (requires `SUPABASE_DB_URL`)
- **Existing:** `apps/web/scripts/apply-step13-only.mjs` — applies only Step 13 migration (requires `SUPABASE_DB_URL`)
- **Recommendation:** Do not add a new "blind replay" script; prefer Supabase CLI or MCP for targeted apply
