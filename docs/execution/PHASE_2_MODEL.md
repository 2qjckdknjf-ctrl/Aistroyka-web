# Phase 2 — Semantic Model (Documents / Acts / Contracts)

**Date:** 2026-04-18  
**Stage:** B — Semantic Model

## Target Behavior

Phase 2 must close one coherent documents loop for manager operations:

1. Create document artifact with explicit type (`document|act|contract`).
2. Upload file and bind artifact to project context.
3. Move to `under_review`.
4. Manager/owner decision:
   - `approved`
   - `rejected`
   - `changes_requested`
5. If `changes_requested`, resubmit path returns to review.
6. Every transition is audit-visible in history.

## Entities

- `project_documents` (primary entity)
- `project_document_events` (append-only event trail)
- document approval-history endpoint output (manager-facing trace)

## State Machine

- `draft -> uploaded`
- `uploaded -> under_review`
- `under_review -> approved | rejected | changes_requested`
- `changes_requested -> uploaded | under_review` (resubmission path)
- optional `* -> archived` where policy allows

Forbidden transitions are enforced by policy (`document.policy.ts`) and must remain explicit.

## Ownership Model

- Internal manager roles operate document workflow actions.
- Owner decision endpoint handles decision actions in owner context.
- Tenant/project scope isolation remains mandatory.

## Closure Criteria (Phase 2)

Phase 2 is `YES` only if:

1. Manager can complete `create -> upload -> link -> under_review -> approve/reject` in product flow.
2. `request_changes -> resubmit` is verified in runtime matrix.
3. Types (`document|act|contract`) are explicit and user-visible where relevant.
4. History/auditability for decisions is available and consistent.
5. Post-audit finds no meaningful unresolved workflow tail.

Otherwise verdict is `NO`.
