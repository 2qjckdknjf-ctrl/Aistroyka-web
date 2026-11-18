# Slice 15 — Tasks board / list + desktop inspector

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented (local, uncommitted)  
**Canonical ref:** Surface D — Tasks (desktop board/list + detail pane)

## In scope

- List ↔ Board toggle via `?view=list|board` (default list).
- Desktop (`lg+`) inspector pane driven by `?task=<id>` reusing `DashboardTaskDetailClient` (routes/API unchanged).
- Board columns: pending / in_progress / done / cancelled.
- Phone list: prioritized cards (overdue → due today → active → rest); full task still opens `/dashboard/tasks/[id]`.
- Pure helpers + Vitest: `tasks-workspace.utils.ts`.

## Out of scope

- Drag-and-drop status changes on the board.
- Gantt / drawing inspector (still absent).
- Entitlement cutover, merge/deploy.

## Validation

```bash
bun run --cwd apps/web check:design
bun run i18n:check
bun run --cwd apps/web lint
bun run --cwd apps/web test -- app/[locale]/(dashboard)/dashboard/tasks/tasks-workspace.utils.test.ts
```
