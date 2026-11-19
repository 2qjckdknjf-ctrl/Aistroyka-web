# V2-WEB-02 — Canon board task open + context restore — 2026-11-19

**Status:** FIXED (source + unit route helpers)  
**Scope:** Canon/default tasks board `?task=` inspector, detail `returnTo`, 404/403 clear  
**Depends:** V2-WEB-01 (Create Task loop) lands separately in #504 — this slice does not reimplement it  
**Not claimed:** authenticated staging visual AC PASS

## Gap

Canon skin set `?task=` on card click but gated the inspector with `skin !== "canon"`, so the selected task never rendered. Deep links lost context; Back from full detail always went to bare `/dashboard/tasks`.

## Fix

1. Show task inspector for Canon (desktop aside + narrow under-board).  
2. `buildTaskDetailHref` / `resolveTasksReturnHref` / `buildTasksWorkspaceHref` / `parseSelectedTaskId` in `tasks-workspace.utils.ts`.  
3. Full-task links carry `returnTo`; `TaskDetailCanonPage` Back restores workspace query.  
4. Detail client clears prior task and maps 403/404 before paint.

## Evidence

- `tasks-workspace.utils.test.ts` — 8 tests including returnTo safety.  
- Source: `DashboardTasksClient.tsx`, `TaskDetailCanonPage.tsx`, `DashboardTaskDetailClient.tsx`.

## Remaining

- V2-WEB-02-TEST-02 authenticated board→detail→Back on staging.  
- V2-WEB-03 scope/pagination visibility.
