# Step 13 — Contractor Action / Intelligence Integration

## 1. Scope

Step 13 does not add a new “action engine” or “intelligence pipeline.” This doc describes how contractor-related signals plug into existing or future surfaces, and what remains out of scope.

## 2. What Is Integrated

| Integration point | What is done |
|------------------|--------------|
| **Manager task list** | Filter by assigned_to (worker/contractor). Manager can focus on one assignee’s tasks. |
| **Manager report list** | Existing worker_id filter. Manager can focus on one worker’s/contractor’s reports. |
| **Worker detail page** | Contractor badge, tasks assigned, tasks overdue, links to “Tasks assigned to this worker” and “View all reports.” Manager gets contractor context without leaving the worker view. |
| **Project workers API** | Optional ?role=contractor (and role=worker, role=manager) to list only contractors on a project. Enables future “Contractors” tab or filter in project UI. |

## 3. What Could Be Wired Later (Not Done in Step 13)

- **Manager action items:** “Review contractor X’s overdue tasks” or “Contractor Y has 3 reports pending approval.” Would require a dedicated action/notification feed that consumes worker summary and report status; not implemented.
- **Contractor performance attention signals:** e.g. “Contractor Z has high overdue rate.” Would require defined thresholds and a place to display them (dashboard widget or notifications); not implemented.
- **Project intelligence / copilot:** “Contractor risk” or “contractor workload” in project context. docs/ai/PREDICTIVE_ANALYTICS.md describes contractor risk scoring; not implemented. No change to copilot or intelligence APIs in Step 13.
- **Overdue / blocked contractor work in a central “attention” list:** Would require a new endpoint or dashboard widget that aggregates overdue tasks by assignee; not implemented.

## 4. Requirements Met

- Only real signals are used (counts from DB; no fake governance or pressure).
- Explainability: worker summary and task/report lists are direct data; no black-box score.
- No new fake “governance” or “performance pressure” features.

## 5. Summary

Contractor flows are integrated into **existing** manager surfaces (tasks list filter, reports list filter, worker detail). Optional project workers role=contractor filter is added for future contractor-focused UI. No new action queue, intelligence API, or notification logic is added in Step 13.
