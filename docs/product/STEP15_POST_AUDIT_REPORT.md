# Step 15 — Project Cost & Market Intelligence Post-Audit Report

## 1. Phase checklist

| # | Area | Status | Notes |
|---|------|--------|--------|
| 1 | Input scope selection | **FULL** | STEP15_INPUT_SCOPE_INVENTORY.md; chosen: budget, images (cost vision), documents as refs; deferred: PDF/CAD/live market. |
| 2 | Estimate domain model | **FULL** | STEP15_ESTIMATE_DOMAIN_MODEL.md; project_estimate_results table; source_type, rough range, confidence, missing/assumption. |
| 3 | Input processing/extraction support | **FULL** | Cost vision prompt + parseCostVisionOutput; analyzeImageForCost with policy + router + usage; prompt override in all vision providers. |
| 4 | Rough estimate layer | **FULL** | GET estimate summary (budget + results + sources); POST from-image; rough range, confidence, missing/assumptions in API and UI. |
| 5 | Market context foundation | **FULL** | Documented (STEP15_MARKET_CONTEXT_FOUNDATION.md); currency_hint and assumption_notes on result; no full engine. |
| 6 | Manager-facing estimate surfaces | **FULL** | Estimate tab + ProjectEstimatePanel: recorded budget, latest AI estimate, estimate-from-image form, source documents list. |
| 7 | Action/budget/document integration | **FULL** | Budget in estimate summary; documents as source_documents; no new priority actions; documented in STEP15_ESTIMATE_ACTION_INTEGRATION.md. |
| 8 | State/confidence clarity | **FULL** | STEP15_ESTIMATE_STATE_MODEL.md; UI labels "Recorded budget" vs "Latest estimate (AI)"; confidence and missing/assumptions shown. |

## 2. Remaining items

- **P0:** None.
- **P1:** Run Vitest (parse-cost-vision, and any estimate repo tests) in an environment where esbuild matches. Apply migration 20260307600000_project_estimate_results.sql in target env.
- **P2:** Document content extraction; CAD support; "missing estimate" priority action; estimate vs budget variance signal; market profile/region setting.

## 3. Next major step allowed

**YES.** Step 15 is closed enough to move forward. The product has a real estimate/cost-intelligence foundation: input scope defined, domain model and table, image-based extraction, rough estimate API and manager UI, market/state docs, and validation (build + focused checks). Remaining items are P1/P2 or deferred by design.
