# Wave 4 Step 15 — Portfolio scope inventory

**Date:** 2026-03-28  
**Status:** Closed for minimal portfolio control layer

## A1 — Signals already in the product

| Signal | Source |
|--------|--------|
| Overdue milestones | `project_summary` / `project_milestones` |
| Pending document approvals | `pendingDecisionsCount` (under_review) |
| Open issues | `project_issues` |
| Budget pressure / over budget | cost layer via `getProjectSummary` |
| Pending report approvals | `countSubmittedReportsForProject` |
| Handover pipeline blockers | `computeHandoverReadiness` (Wave 4 Step 12) |
| Open change orders / discussions / non-final docs / client requests | Same handover readiness model |
| Blocking punch defects | `defects.repository.countBlockingOpen` |
| Active aftercare | `project_service_requests` (status ≠ closed) |

## A2 — Elevated to portfolio level

All of the above are **aggregated per project** into a single **portfolio control row** with a **dominant focus category** and **portfolio state** (healthy / attention / critical).

## A3 — Questions this step answers

- Which projects are **healthy / attention / critical** at a glance?  
- Which **dominant pressure** dominates (budget, punch list, schedule, approvals, …)?  
- What **counts** justify the row (compact signal line)?  
- Where to **drill down** (manager project routes)?

## A4 — Explicitly deferred

- ML forecasting, portfolio AI scoring as the primary control signal  
- Org-wide analytics warehouse / BI exports  
- Resource leveling and cross-project staffing optimization  
- Executive PDF/reporting platform  
- Broad app shell redesign
