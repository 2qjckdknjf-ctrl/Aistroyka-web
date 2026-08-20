# Slice 20 — Overview phone density

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented (local, uncommitted)  
**Canonical ref:** Surface A — phone/tablet density (attention-first, no new routes)

## In scope

- Phone KPI strip: primary attention metrics first; secondary behind “More metrics”.
- Phone queues: urgency-sorted, empty queues hidden; all-clear state when none.
- Manager actions: top 3 on phone with expand/collapse.
- Tablet/desktop keep full KPI + queue status grids.

## Out of scope

- API / RBAC changes, Gantt, entitlement cutover.

## Validation

```bash
bun run --cwd apps/web test -- ops-overview-density
bun run i18n:check
bun run --cwd apps/web check:design
bun run --cwd apps/web lint
```
