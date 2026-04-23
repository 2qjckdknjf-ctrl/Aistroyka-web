# Wave 4 Step 11 — Manager UI report (Stage E)

## E1. Surfaces

| Location | Purpose |
|----------|---------|
| `ChangeOrdersManagerPanel.tsx` | On project overview (when user can manage client portal): list change orders, create with kind, draft vs proposed, impact levels, notes. |
| `change-orders/[changeOrderId]/ManagerChangeOrderDetailClient.tsx` | Full record: edit when status is `draft` / `proposed` / `under_review`; transition dropdown with optional audit note; event history with actor ids. |

## E2. Workflow

1. Create as **draft** (internal) or **proposed** (client-visible once shared).
2. Move through review → **approved** or **rejected**.
3. **Implement** when work reflects the change; optionally **archive**.

## E3. Limitations

- No inline entity picker for links; UUIDs can be added via PATCH from API or future UI.
- Dashboard layout unchanged aside from new panel.
