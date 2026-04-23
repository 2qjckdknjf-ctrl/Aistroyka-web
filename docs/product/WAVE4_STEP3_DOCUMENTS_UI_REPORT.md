# Wave 4 Step 3 — Manager UI report

## D1. Surfaces

| Surface | Location | Behavior |
|--------|----------|----------|
| Project documents tab | `ProjectDocumentsPanel.tsx` (project detail `?tab=documents`) | List with type + status; create/register; upload path; manager actions for valid transitions; link to history |
| Document history | `DocumentApprovalHistory.tsx` | Renders `project_document_events` or legacy audit payload from API |
| Project summary / governance cards | `DashboardProjectDetailClient.tsx` | Summary line for active document count; Pending decisions card links to Documents tab; attention routing to documents when `pending_decisions` |

## D2. Principles

- Incremental: documents live in existing project detail shell — no full dashboard redesign.
- Explicit labels for type (`document` / `act` / `contract`) and status.

## D3. Limitations

- No global “all documents across projects” ECM view in this step.
- No full-text search or faceted filters.
