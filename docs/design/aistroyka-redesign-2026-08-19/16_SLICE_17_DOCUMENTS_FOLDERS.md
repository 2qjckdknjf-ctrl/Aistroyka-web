# Slice 17 — Documents folder chrome

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented (local, uncommitted)  
**Canonical ref:** Surface F — structured folders/categories

## In scope

- Category/folder chips on `ProjectDocumentsPanel`: All / Act / Contract / Document.
- Filter + counts via `documents-workspace.utils.ts` (pending-in-folder hint).
- Upload, approval, and linkage flows unchanged.

## Out of scope

- Drawing inspector / annotation tooling (still absent in codebase — do not invent).
- Nested folder trees or rename/move APIs.

## Validation

```bash
bun run --cwd apps/web check:design
bun run i18n:check
bun run --cwd apps/web test -- documents-workspace
bun run --cwd apps/web lint
```
