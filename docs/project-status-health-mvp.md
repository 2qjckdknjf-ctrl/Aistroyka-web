# Project Status / Health Presentation — MVP

Derived presentation layer for project status and health. **Not** a full project lifecycle engine or enterprise analytics platform.

## Status Model

| Status     | Meaning                                           | Derived from                                                   |
|------------|---------------------------------------------------|----------------------------------------------------------------|
| `draft`    | No work defined yet                               | `tasksTotal === 0 && milestonesCount === 0`                     |
| `completed`| All tasks done                                    | `tasksTotal > 0 && tasksDone >= tasksTotal`                    |
| `blocked`  | Multiple documents awaiting approval              | `pendingDecisionsCount >= 2`                                   |
| `at_risk`  | Several open issues need attention                | `openIssuesCount >= 3`                                         |
| `active`   | Normal progress                                   | Default when none of the above match                           |

### Priority (when multiple conditions could apply)

1. **completed** — highest
2. **draft**
3. **blocked**
4. **at_risk**
5. **active** — lowest

## Health Level

- **good** — No attention needed
- **warning** — Some signals (1–2 issues, 1 pending decision)
- **critical** — Blocked or at_risk status

## Signals

- **Critical:** `openIssuesCount >= 3`, `pendingDecisionsCount >= 2`
- **Warning:** `openIssuesCount >= 1`, `pendingDecisionsCount >= 1`
- **Informational:** Counts for display (tasks, milestones)

## Attention Items

- Open issues (count)
- Documents awaiting decision (count)

## API

`GET /api/v1/projects/:id/summary` returns:

- `projectStatus`: `draft` | `active` | `at_risk` | `blocked` | `completed`
- `healthLevel`: `good` | `warning` | `critical`
- `statusReasons`: Array of `{ code, label, hint }`
- `attentionItems`: Array of `{ id, label, severity, count }`

## MVP Limitations

- Uses only existing summary counts (no new DB queries for derivation)
- No overdue/stalled task detection (would require `due_date` in summary)
- No `in_review` issues count separately (uses `openIssuesCount` = open + in_review)
- No `changes_requested` documents count (uses `pendingDecisionsCount` = under_review only)
- No recent activity / staleness detection
- No milestone progress tracking
- Deterministic and explainable; no ML or predictive scoring

## Implementation

- `lib/domain/projects/project-status.types.ts` — Types
- `lib/domain/projects/project-status.service.ts` — `deriveProjectStatus(input)`
- Summary API extends response with derived fields
- Manager and Owner views consume API-derived status
