# Wave 4 Step 5 — Customer decisions & actions (Stage D)

## D1 — Supported actions in this step

| Intent | Implementation |
|--------|----------------|
| See what needs attention | **Read-only** list (`decisions`) on `ClientProjectView` |
| Semantics | `document_review_needed` (under review) vs `changes_requested` |

## D2 — Integration with existing flows

- No new mutation API for “customer approve” in the portal.
- UI links to **`/dashboard/projects/[id]/owner`** (“Open owner workspace”) for substantive decisions, reusing the existing owner decision workflow.

## D3 — Explicit kinds (as implemented)

| Kind | When |
|------|------|
| `document_review_needed` | Visible document with `status === under_review` |
| `changes_requested` | Visible document with `status === changes_requested` |

## Limitations (honest)

- **No** “acknowledge only” or “info_only” as separate API fields — those would be future enhancements.
- **No** customer-submit from the client page alone; stakeholder must use owner workspace flows already in the product.
