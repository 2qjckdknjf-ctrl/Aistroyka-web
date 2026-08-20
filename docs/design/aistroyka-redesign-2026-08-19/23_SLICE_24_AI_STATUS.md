# Slice 24 — AI requests status density

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented  
**Canonical ref:** Surface I AI queue — attention status chips

## In scope

- Summary status chips (failed/dead/running always when total > 0).
- Client-side attention sort for visible rows.
- Toggle syncs existing FilterBar `status` param.

## Validation

```bash
bun run --cwd apps/web test -- ai-requests-workspace
```
