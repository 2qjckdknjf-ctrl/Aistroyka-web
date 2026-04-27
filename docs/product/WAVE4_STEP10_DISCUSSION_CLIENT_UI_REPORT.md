# Wave 4 Step 10 — Stakeholder (client portal) UI report (Stage E)

## E1. Surfaces

| Location | Purpose |
|----------|---------|
| `client/discussions/page.tsx` + `ClientPortalDiscussionsListClient.tsx` | List project discussions with status and link to detail. |
| `client/discussions/[discussionId]/...` + `ClientPortalDiscussionDetailClient.tsx` | Read thread, post structured response when status allows (`open` / `awaiting_stakeholder`). |

## E2. Trust and safety

- **No** internal author UUIDs on entries in the public API shape.
- **No** `created_by` / `resolved_by` on stakeholder detail payload (see `StakeholderDiscussionPublicDetail`).
- Status and resolution summary are visible so stakeholders understand outcome.

## E3. Response flow

- Entry kinds available in UI align with service rules (stakeholders cannot submit `resolution_note`).
- Empty states use shared `EmptyState` with icon (build requirement).

## E4. Limitations

- No rich attachments on entries in this step (text body only).
- Promo/link from main client portal view may point to discussions list (see integration doc).
