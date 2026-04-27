# Wave 4 Step 1 — Executive summary

## What shipped

- **Aligned milestone lifecycle** in DB and app: `planned` → `in_progress` → `completed` / `delayed` / `archived`.
- **Enriched milestone list API** with linked task metrics and **explainable schedule signals** (overdue, due soon, no tasks, delayed flag, incomplete past target).
- **Project summary** exposes **`overdueMilestonesCount`**; **derived status** adds **`overdue_milestones`** to `attentionItems`.
- **Manager UI:** Schedule tab with milestone cards, progress, signal copy, create milestone, PATCH status; overview card highlights overdue with link to Schedule.

## What did not ship (by design)

- Gantt, dependencies, CPM, auto-delay rules, worker app changes, approvals/documents/budget work.

## Documents

| Doc |
|-----|
| `WAVE4_STEP1_SCHEDULE_INVENTORY.md` |
| `WAVE4_STEP1_SCHEDULE_BACKEND_REPORT.md` |
| `WAVE4_STEP1_SCHEDULE_SIGNALS_REPORT.md` |
| `WAVE4_STEP1_SCHEDULE_UI_REPORT.md` |
| `WAVE4_STEP1_SCHEDULE_INTEGRATION_REPORT.md` |
| `WAVE4_STEP1_SCHEDULE_VALIDATION_REPORT.md` |
| `WAVE4_STEP1_SCHEDULE_POST_AUDIT.md` |
| `WAVE4_STEP1_SCHEDULE_SUMMARY.md` (this file) |

## Next suggested step (P1)

Unify overdue milestone visibility with the dashboard **Needs attention** block (summary `attentionItems` or attention API).
