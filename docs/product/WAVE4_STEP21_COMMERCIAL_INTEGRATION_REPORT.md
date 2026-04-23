# Wave 4 Step 21 — Integration report (Stage E)

## E1 — Connections

| Integration | Behavior |
|-------------|----------|
| **Project summary** | `getProjectSummary` adds `commercialItemCount`, `commercialOverdueCount`, `commercialOutstandingAmount` via `getCommercialAggregatesForProject` |
| **Derived status / attention** | `deriveProjectStatus` adds `commercial_overdue` attention item + health warning when count &gt; 0 |
| **Change orders** | Optional link on create/update; validated in service |
| **Documents** | Optional `linked_document_id`; validated in service |
| **Portfolio summary API** | `commercialOverdueCount`, `commercialOpenUnpaidCount` on `GET /api/v1/portfolio/summary` |
| **Project review pack** | `buildProjectReviewPack` includes `commercial` snapshot + action focus line when overdue |
| **Portfolio review pack** | `buildPortfolioReviewPack` includes `commercialSignals` |

## E2 — Intentionally not built

- No new **Stripe** workspace billing linkage (that remains platform subscription / pilot).  
- No **automatic** commercial line from change-order approval (manual or future job).  
- No **handover gate** that blocks completion on unpaid lines (data is visible; enforcement deferred).
