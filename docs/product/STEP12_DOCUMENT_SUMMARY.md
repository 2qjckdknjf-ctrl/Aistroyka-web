# Step 12 — Document Layer Summary

**Date:** 2026-03-18

## What is now real

Managers can now work with a structured Documents / Acts / Contracts layer:
- `document | act | contract` types are stored in `public.project_documents`
- explicit lifecycle statuses are enforced and shown:
  - `draft → uploaded → under_review → approved | rejected → archived`
- file upload is wired via storage (`object_path` in `media` bucket)
- manager governance actions are real and auditable:
  - status transitions are validated on the backend
  - audit events are emitted to `audit_logs`
  - managers can view “Approval history” per document via a dedicated endpoint/UI
- action/intelligence already uses `under_review` documents to produce “Review pending documents” recommendations that route to the project Documents tab.

## What remains partial (and why)

- Deep-link to a specific document row from global action surfaces is not implemented yet (only project/tab routing is available in the current recommendation payload).
- Creation UI currently emphasizes milestone linkage; report/task linkage is shown when present but not fully exposed for creation in this phase.

## Next major step allowed?

**YES.** Step 13 is allowed because Step 12’s core document layer (scope + lifecycle + governance + manager surfaces + validation) is complete within this phase’s constraints.

