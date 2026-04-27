# Wave 4 Step 21 — Executive summary

## One paragraph

Aistroyka now has a **project-scoped commercial / billing control layer**: **`project_commercial_items`** with **finite kinds and statuses**, **optional links** to change orders and documents, **payment time** via `paid_at`, **overdue** semantics with DB refresh, **APIs** under `/api/v1/projects/:id/commercial-items`, and **manager surfaces** (summary card, Commercial tab, project/portfolio review packs, portfolio overdue banner) — without ERP, tax, or ledger scope.

## Doc index

1. `WAVE4_STEP21_COMMERCIAL_INVENTORY.md`
2. `WAVE4_STEP21_COMMERCIAL_BACKEND_REPORT.md`
3. `WAVE4_STEP21_COMMERCIAL_GOVERNANCE_REPORT.md`
4. `WAVE4_STEP21_COMMERCIAL_UI_REPORT.md`
5. `WAVE4_STEP21_COMMERCIAL_INTEGRATION_REPORT.md`
6. `WAVE4_STEP21_COMMERCIAL_VALIDATION_REPORT.md`
7. `WAVE4_STEP21_COMMERCIAL_POST_AUDIT.md`
8. `WAVE4_STEP21_COMMERCIAL_SUMMARY.md` (this file)

## Follow-ups (non-blocking)

- PATCH route tests (P1)  
- Event timeline UI (P2)
