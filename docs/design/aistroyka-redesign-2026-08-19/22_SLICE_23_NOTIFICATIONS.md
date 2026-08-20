# Slice 23 — Notifications density chrome

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented  
**Canonical ref:** Ops notifications — unread-first + phone cards

## In scope

- Read filter chips (`?read=all|unread|read`) with counts.
- Unread-first sort; phone card list / desktop table.
- Href helper extracted (routes unchanged).

## Validation

```bash
bun run --cwd apps/web test -- notifications-workspace
```
