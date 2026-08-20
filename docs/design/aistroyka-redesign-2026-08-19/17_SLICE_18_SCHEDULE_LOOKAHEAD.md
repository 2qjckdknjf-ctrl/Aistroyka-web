# Slice 18 — Schedule lookahead

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented (local, uncommitted)  
**Canonical ref:** Surface G — phone/tablet lookahead & actionable delays (no Gantt)

## In scope

- Lookahead window toggle: 7 / 14 / 30 days.
- 7-day density strip (counts only — not a timeline/Gantt).
- Partitioned lists: overdue → lookahead → later → done (`schedule-health.ts`).
- Existing KPI strip + create milestone flow unchanged.

## Out of scope

- Desktop Gantt / dependency graph (absent — do not invent).

## Validation

```bash
bun run --cwd apps/web test -- schedule-health
bun run i18n:check
bun run --cwd apps/web check:design
bun run --cwd apps/web lint
```
