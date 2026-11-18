# Slice 07 — Schedule & Milestones (Surface G)

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented (local, uncommitted)

## In scope

- Schedule health strip: overdue / upcoming / done (`ProjectSchedulePanel` + `schedule-health.ts`).
- Phone-first milestone list kept (no compressed Gantt).
- Overdue highlighting unchanged in behavior, now shared helper.

## Out of scope

- Desktop Gantt / dependency graph — lookahead chrome is Slice 18.

## Validation

```bash
bun run --cwd apps/web test -- schedule-health
bun run i18n:check
```
