# Needs Attention / Reminders — Light MVP

Derived attention surface. **No scheduler, no cron, no background jobs.**

## What it is

A **live-derived** actionable queue showing what requires attention right now. Computed on read from current project state. Not a reminder delivery system.

## Item types

| Type                | Source                      | Severity                         | Who sees  |
|---------------------|-----------------------------|----------------------------------|-----------|
| `pending_decision`  | Documents `under_review`     | critical if ≥2, else warning      | Owner, Manager |
| `changes_requested` | Documents `changes_requested`| warning                          | Owner, Manager |
| `open_issue`        | Issues `open` or `in_review` | critical if ≥3 issues, else warning | Manager only |

## Reminder-like rules (live derived)

- **under_review document** → always an attention item until approved/rejected
- **changes_requested document** → attention item until resubmitted
- **open/in_review issue** → attention item until resolved/closed

No background sends. No synthetic reminder rows. Only derived rules from current state.

## vs Notifications

- **Notifications** = event-driven records in `manager_notifications` (who was told, when)
- **Attention layer** = derived actionable queue (what needs action now)
- Notifications are written when events occur; attention is computed on read.

## Prioritization

1. Pending decisions (owner action)
2. Changes requested (resubmission needed)
3. Open issues (review/resolve)

Within each type, newest first.

## API

`GET /api/v1/projects/:id/attention?viewer=manager|owner`

Returns: `items`, `sections`, `totalCount`, `criticalCount`, `warningCount`.

## Viewer roles

- **manager**: all item types
- **owner**: pending_decision, changes_requested (no open_issue)

## MVP limitations

- No cron/scheduler
- No email or push reminders
- No notification digest
- No overdue/stalled task detection
- No SLA engine
- Derived on read only; no background computation
