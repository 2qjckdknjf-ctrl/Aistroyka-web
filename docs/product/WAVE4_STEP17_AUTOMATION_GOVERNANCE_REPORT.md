# Wave 4 Step 17 — Governance

## C1 — Execution path

Single path: **cron-tick** → `runRecurringOperationalAutomation` → Supabase admin client (bypasses RLS for writes).

## C2 — Cadence semantics

- **every_n_days** (default **7**) — `computeNextDueAt` adds N calendar days in UTC.  
- **Dedupe period** — `dedupePeriodKey`: daily → UTC date; weekly / every_n_days with n≥7 → ISO week key (`YYYY-Www`).  
- Prevents duplicate **fires** for the same tenant+kind+project in the same period via `dedupe_key` unique constraint.

## C3 — Outputs

1. **manager_notifications** — `notifyProjectManagers` with `type: recurring_ops_<kind>`  
2. **recurring_automation_fire_events** — audit row  
3. **Workload** — `buildManagerWorkload` merges recent fires (7-day lookback) as explainable workload rows  

## C4 — Anti-spam

- Dedupe key uniqueness (DB-enforced)  
- One notification only when insert succeeds (duplicate week → no second notification)  
- Rule `next_due_at` advanced after each evaluation pass so rules are not evaluated every minute  

## C5 — Auditability

Each fire stores `rule_kind`, `project_id`, `dedupe_key`, `payload` (project name + detail).

## Limitations

- First cron after deploy may insert four rules per tenant with `next_due_at = now`, causing a burst of evaluations.  
- Multiple rule kinds can each notify for the same project in one tick if all conditions hold (intentional separation; can feel noisy — tune later).  
