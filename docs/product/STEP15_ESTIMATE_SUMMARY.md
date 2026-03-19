# Step 15 — Project Cost & Market Intelligence Summary

## What estimate/cost intelligence capability is now real

- **Separate intelligence block:** Estimate is a distinct layer from budget. Budget = recorded cost items (Step 14). Estimate = AI-derived rough signals and optional assumption; stored in project_estimate_results.
- **Input scope:** (1) Existing budget/cost data as comparison and context. (2) Images: one image URL → cost vision (work categories, rough range, confidence, missing/assumptions) → one estimate result saved. (3) Project documents listed as source references (no content extraction).
- **Estimate result entity:** project_estimate_results: source_type (image | budget_snapshot | assumption), rough_range_min/max, currency_hint, confidence, missing_data_reasons, assumption_notes, work_categories, timestamps, tenant/project.
- **APIs:** GET /api/v1/projects/:id/estimate (summary: budget + latest result + all results + source_documents). POST /api/v1/projects/:id/estimate/from-image (body: image_url) → runs cost vision, persists result, returns result + summary.
- **Manager UI:** Project → Estimate tab. Shows recorded budget (if any), latest AI estimate (source, range, confidence, missing, assumptions), "Estimate from image" (URL input + Run), and source documents list. Clear labels: "Recorded budget" vs "Latest estimate (AI)."
- **Explainability:** Confidence (low/medium/high), missing_data_reasons, and assumption_notes are stored and displayed. No fake exactness.

## What remains rough/partial and why

- **Document content:** No PDF/DOC text extraction; documents are metadata-only sources. Deferred: no pipeline in repo.
- **CAD/DWG:** Not supported; deferred.
- **Market engine:** Only foundation (currency_hint, assumption_notes); no country/region/city pricing engine.
- **Tests:** parseCostVisionOutput covered by unit tests; full Vitest run may be blocked by environment (esbuild). Migration must be applied in deployment.

## Next major step allowed

**Yes.** Step 15 is closed. The product has a real estimate/cost-intelligence foundation, explicit semantics, manager-facing value, and honest confidence/missing-data handling. No blocking P0 items. Proceeding to Step 16 (or next planned step) is allowed.

## Exact blockers (if any)

None. Apply migration 20260307600000_project_estimate_results.sql where the app runs; ensure SUPABASE_SERVICE_ROLE_KEY (and AI keys for cost-from-image) are configured for from-image to work.
