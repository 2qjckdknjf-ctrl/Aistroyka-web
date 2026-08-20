# Slice 19 — Approvals review chrome

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented (local, uncommitted)  
**Canonical ref:** Surface E / decision queue — oldest-first approvals with split review chrome

## In scope

- Kind filter chips: All / Report / Document (`?kind=`).
- Oldest-pending-first sort (actionable delay priority).
- Desktop split: queue list (evidence) + sticky decision pane (`?focus=kind:id`).
- Localized relative age via `minutesAgoShort` / `hoursAgoShort` / `daysAgoShort`.
- Glass card chrome; open existing report/document review routes (no new approval API).

## Out of scope

- Inline approve/reject on the inbox (still opens dedicated review surfaces).
- Entitlement / billing cutover.

## Validation

```bash
bun run --cwd apps/web test -- approvals-workspace
bun run i18n:check
bun run --cwd apps/web check:design
bun run --cwd apps/web lint
```
