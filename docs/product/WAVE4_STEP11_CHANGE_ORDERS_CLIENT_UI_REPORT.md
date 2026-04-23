# Wave 4 Step 11 — Stakeholder visibility report (Stage F)

## F1. Surfaces

| Location | Purpose |
|----------|---------|
| `client/change-orders/ClientPortalChangeOrdersListClient.tsx` | Lists change orders **excluding drafts** (enforced server-side). |
| `client/change-orders/[changeOrderId]/ClientPortalChangeOrderDetailClient.tsx` | Title, rationale, impact levels/summaries/deltas, implementation date, **status history without transition notes**. |
| `ClientPortalViewClient.tsx` | Promo card linking to change orders list. |

## F2. Visibility rules

- **No** `created_by` / `implemented_by` user ids on public detail.
- **No** raw UUID links exposed; boolean flags only (`has_linked_*`).
- **Transition notes** from manager transitions are **not** exposed to stakeholders (service maps `note: null` on public events).

## F3. Limitations

- Stakeholders cannot approve/reject in app in this step (manager-led lifecycle); future step could add explicit client sign-off if product requires it.
