# Wave 4 Step 10 — Manager UI report (Stage D)

## D1. Surfaces

| Location | Purpose |
|----------|---------|
| `StakeholderDiscussionsManagerPanel.tsx` | Embedded on project dashboard: list discussions, create new (kind, title, context, optional link type/id, initial status). |
| `discussions/[discussionId]/page.tsx` + `ManagerDiscussionDetailClient.tsx` | Full thread: entries (with author ids for managers), post structured update, **Resolve** (summary), **Close**. |

## D2. Workflow

1. Create discussion → defaults to `awaiting_stakeholder` unless overridden.
2. Stakeholder responds in portal → status becomes `awaiting_manager` (when RPC applied).
3. Manager posts updates or resolves with mandatory summary → `resolved` + `resolution_note` entry.
4. Optional close after resolution.

## D3. Linkage

- Optional `linked_entity_type`: `document` | `milestone` | `client_request` plus `linked_entity_id` (UUID).  
- No deep navigation picker in this step; fields are explicit form inputs where implemented.

## D4. Limitations

- No bulk actions or cross-project discussion inbox.
- Dashboard layout unchanged except for the new panel wiring.
