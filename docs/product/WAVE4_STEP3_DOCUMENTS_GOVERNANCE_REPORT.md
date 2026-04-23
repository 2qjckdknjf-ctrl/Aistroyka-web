# Wave 4 Step 3 — Governance report

## C1. Lifecycle handling

- **Policy layer:** `validateDocumentStatusTransition` in `document.policy.ts` enforces allowed edges (e.g. no skip from `draft` to `approved` without upload/review path).
- **Execution:** `updateDocument` applies transitions for managers; `performOwnerDecision` applies owner outcomes when document is `under_review`.
- **Observability:** `emitAudit` continues to record actions for owner/admin diagnostics.
- **Tenant-visible history:** `project_document_events` records the same conceptual steps with optional **notes** on review outcomes (manager PATCH and owner decision).

## C2. Reuse of approval concepts

- Same vocabulary as report review where sensible: submitted → review → approve / reject / request changes.
- **Notifications:** `notifyProjectOwners` / `notifyProjectManagers` for document_under_review, resubmit, and owner decision — parallel to report approval signals.

## C3. Design choice: status + events + audit (minimal safe path)

**Chosen:** Hybrid — **status** is source of truth for “where the document is now”; **append-only events** are the manager-readable timeline; **audit_logs** remain for restricted admin visibility and legacy fallback.

**Why not approval-table joins:** Avoids duplicating a full second approval engine for artifacts that already have a simple state machine; keeps Wave 4 Step 3 bounded.

**Why events table:** `audit_logs` SELECT is not universally available to all manager roles; events table is RLS-aligned with tenant membership so managers see full history in the UI.

## C4. Explainability

- UI shows status on each row; history modal reads `/approval-history` and displays event types (and legacy audit actions when applicable).
- Owner decision comments flow into events as `note` where applicable.

## Limitations (explicit)

- No e-sign or legal workflow automation.
- No parallel multi-step approval chains — single linear lifecycle per document.
