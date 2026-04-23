# Wave 4 Step 17 — Integration

## E1 — Feeds

| Target | Mechanism |
|--------|-----------|
| Manager notifications | `notifyProjectManagers` from runner |
| Workload / inbox | `listRecentFiresForWorkload` + `appendRecurringAutomationWorkload` in `workload.service.ts` |
| Cron observability | `cron-tick` JSON adds `recurring_operations: { tenantsProcessed, rulesRun, fires, notifications }` |

## E2 — No duplicate systems

Workload reuses Step 16 read model; recurring rows add **automation** context (`linked_entity_type: recurring_rule`) and explicit titles. No parallel “task” store.

## Not touched

- Stakeholder reminder pipeline (`runStakeholderNotificationReminders`) — unchanged except ordering in cron  
- `jobs` queue types — no new job type for recurring ops (in-process in cron tick)  
