# Slice 04 — Tasks (Surface D)

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented (local, uncommitted)  
**Canonical ref:** Surface D — Tasks (execution list + detail)

## In scope

- Tasks list table on **`DashboardGlassCard`** (`DashboardTasksClient.tsx`).
- Task detail header/metadata on **`DashboardGlassCard`** (`DashboardTaskDetailClient.tsx`).
- Existing filter bar, status actions, assign/create flows unchanged (routes/API intact).

## Out of scope

- Drag-and-drop board status (see Slice 15 for board/list + inspector).
- Phone card layout beyond prioritized list (Slice 15).

## Validation

```bash
bun run --cwd apps/web check:design
bun run i18n:check
bun run --cwd apps/web lint
```
