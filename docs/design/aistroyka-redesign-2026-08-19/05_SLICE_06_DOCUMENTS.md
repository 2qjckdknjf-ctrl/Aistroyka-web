# Slice 06 — Documents & Drawings (Surface F)

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented (local, uncommitted)

## In scope

- Proof Pack panel on Liquid Glass (`ProjectProofPackPanel`).
- Documents pending-review strip as a glass attention banner (`ProjectDocumentsPanel`).
- Upload, version/status, approval, and linkage flows unchanged.

## Out of scope

- Folder tree / drawing inspector redesign — folder chips landed in Slice 17; drawing inspector still absent.
- Annotation tooling.

## Validation

```bash
bun run --cwd apps/web check:design
bun run i18n:check
bun run --cwd apps/web lint
```
