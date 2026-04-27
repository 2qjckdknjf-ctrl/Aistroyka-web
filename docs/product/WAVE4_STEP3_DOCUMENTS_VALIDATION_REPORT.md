# Wave 4 Step 3 — Validation report

**Date:** 2026-03-28 (execution in dev workspace)

## Tests

| Command | Result |
|---------|--------|
| `npm run test` (from `apps/web`, Vitest) | **PASS** — 186 files, 1135 tests |

**Focused areas for this step**

- `lib/domain/documents/document.policy.test.ts` — lifecycle transitions
- `lib/domain/documents/document.repository.test.ts` — persistence queries
- `lib/domain/documents/document-event.repository.test.ts` — insert + list behavior
- `lib/ai-brain/phase-a/truth-snapshot/project-truth-snapshot.assembler.test.ts` — `ProjectSummary` includes `projectDocumentsActiveCount`

## Build

| Command | Result |
|---------|--------|
| `npm run build` (repo root: contracts + `apps/web` Next.js production build) | **PASS** |

## Focused manual / route checks (recommended after deploy)

- `GET /api/v1/projects/:id/summary` — returns `projectDocumentsActiveCount` and `pendingDecisionsCount`
- `GET /api/v1/projects/:id/documents/:id/approval-history` — returns `source: project_document_events` when migration applied
- UI: project → Documents tab → create, upload, submit for review, approve/reject, history modal

## Gaps (non-blocking for closure)

- Dedicated HTTP route tests for document REST handlers are not required for this step but would be a **P2** hardening item.
