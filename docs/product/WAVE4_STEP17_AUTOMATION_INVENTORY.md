# Wave 4 Step 17 — Recurring automation scope inventory

## A1 — Domains inspected

| Domain | Used in Step 17 |
|--------|-----------------|
| Handover readiness / blockers | Yes — `handover_blocked_followup` |
| Blocking punch defects | Yes — `blocking_defects_followup` |
| Discussions awaiting manager (staleness) | Yes — `stale_discussion_manager` (7+ days without update) |
| Aftercare / service requests | Yes — `aftercare_open_review` |
| Overdue milestones / approvals | No — already in workload; not duplicated as recurring-only |
| Client requests (stakeholder) | No — existing stakeholder reminder cron (Step 8) |
| Cron-tick | Yes — extended |
| Workload / inbox | Yes — merged signals from fire events |

## A2 — Automations chosen (finite)

1. **handover_blocked_followup** — handover not ready with ≥1 blocker  
2. **blocking_defects_followup** — blocking punch defects > 0  
3. **stale_discussion_manager** — status `awaiting_manager` and `updated_at` older than 7 days  
4. **aftercare_open_review** — open `project_service_requests` (not `closed`)

All default to **every 7 days** (`cadence: every_n_days`, `cadence_days: 7`).

## A3 — Deferred

- User-defined automations, visual workflow builder, arbitrary scripting  
- Portfolio forecasting / ML-driven rules  
- Per-project custom cadences in UI (schema allows `project_id` later; not exposed)  
- AI-generated rules  
- Android-specific surfaces  
