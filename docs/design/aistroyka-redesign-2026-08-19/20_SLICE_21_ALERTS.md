# Slice 21 — Alerts density chrome

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented (local, uncommitted)  
**Canonical ref:** Surface I / Intelligence alerts — attention-first filters

## In scope

- Status chips: All / Open / Resolved (`?status=`).
- Severity chips: Any / Critical / Warning / Info (`?severity=`).
- Sort: unresolved → higher severity → newest.
- Localized page chrome; full list via `AlertFeed maxItems={null}`.
- Hash deep-link scroll preserved.

## Out of scope

- New alert schema / per-alert project URLs.
- API or RBAC changes.

## Validation

```bash
bun run --cwd apps/web test -- alerts-workspace
bun run i18n:check
bun run --cwd apps/web check:design
bun run --cwd apps/web lint
```
