# Slice 22 — Workload inbox chrome

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented (local, uncommitted)  
**Canonical ref:** Operations inbox — priority density + phone cards

## In scope

- Priority filter chips with counts (`?priority=`), urgent-first sort.
- Glass filter bar; glass empty / table wrappers.
- Phone: card list; tablet/desktop: table.
- Existing manager + leadership audiences unchanged.

## Out of scope

- New workload kinds / API changes.
- Recurring operations panel redesign.

## Validation

```bash
bun run --cwd apps/web test -- workload-inbox
bun run i18n:check
bun run --cwd apps/web check:design
bun run --cwd apps/web lint
```
