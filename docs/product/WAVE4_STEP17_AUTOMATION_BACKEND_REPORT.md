# Wave 4 Step 17 — Automation backend

## B1 — Tables

**`recurring_operational_rules`**

| Column | Purpose |
|--------|---------|
| id | UUID PK |
| tenant_id | Tenant scope |
| project_id | Nullable (reserved; v1 seeds tenant-wide only) |
| rule_kind | Finite enum (see inventory) |
| audience | `manager` |
| cadence | `daily` \| `weekly` \| `every_n_days` |
| cadence_days | Interval when `every_n_days` |
| active | Enable/disable |
| last_fired_at / next_due_at | Scheduler state |
| created_by, created_at, updated_at | Audit |

Unique: `(tenant_id, rule_kind)`.

**`recurring_automation_fire_events`**

| Column | Purpose |
|--------|---------|
| dedupe_key | Unique — idempotency per tenant/rule/project/period |
| rule_id, tenant_id, project_id, rule_kind | Audit linkage |
| fired_at, payload | Evidence |

## B2 — Execution

- `runRecurringOperationalAutomation(admin)` in `recurring-operations.runner.ts`  
- Invoked from `POST /api/v1/admin/jobs/cron-tick` (service role)  
- `ensureDefaultRulesForTenant` inserts four rules per tenant (ignore duplicate)  
- For each **due** rule (`next_due_at` null or ≤ now), evaluates up to 25 projects per tenant  
- On match: insert fire event (dedupe) → `notifyProjectManagers` → advance `next_due_at`  

## B3 — Not a workflow engine

Logic is explicit `switch(rule_kind)` + domain helpers (`computeHandoverReadinessFromSummary`, counts). No graph interpreter.
