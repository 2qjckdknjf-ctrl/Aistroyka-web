# Wave 4 Step 1 — Schedule signals (Stage C)

## Principles

- Every signal has a **fixed `code`** and a **human `reason`** string.
- No critical path, no simulated dependencies, no ML predictions.

## Per-milestone signals (`buildMilestoneScheduleSignals`)

Implemented in `lib/domain/milestones/milestone.schedule.ts`.

| Code | When it fires | Why (explainability) |
|------|----------------|----------------------|
| `milestone_delayed_status` | `status === delayed` | Explicitly marked delayed — manager intent |
| `milestone_no_linked_tasks` | Active status, zero linked tasks | Schedule execution undefined at task level |
| `milestone_incomplete_tasks_past_target` | Target before today, active status, incomplete linked tasks | Counts incomplete tasks after target date |
| `milestone_overdue` | Target before today, active status, no incomplete-task branch (or zero linked) | Calendar comparison to server “today” |
| `milestone_due_soon` | Target within next **7 days**, not overdue, active | Fixed horizon `DUE_SOON_DAYS = 7` |

**Inactive for signaling:** `completed`, `archived` — signals array empty.

## Derived fields (same API response)

- **`linked_tasks_total` / `linked_tasks_done`** — from `worker_tasks` where `milestone_id` matches.
- **`task_progress_percent`** — `round(done/total*100)`, or 0 if no tasks.

## Project-level signals

### Summary count

- **`overdueMilestonesCount`** (repository): milestones with `target_date < today` and status in `planned` | `in_progress` | `delayed`.

### Derived attention (`deriveProjectStatus`)

- **`attentionItems`**: entry `overdue_milestones` when `overdueMilestonesCount > 0`, severity `warning` if 1, `critical` if ≥ 2.

## AI Brain (`milestone-pressure.service.ts`)

- Considers “active” milestones for pressure copy: **`planned`, `in_progress`, `delayed`** (excludes `completed` / `archived`).

## Limitations (explicit)

- **No** “milestone B blocks milestone A” logic.
- **No** automatic transition to `delayed` — remains a manual (or future rules) concern.
- **Due soon** is a fixed 7-day window, not workload-based.
