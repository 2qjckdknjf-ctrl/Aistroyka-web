# Step 15 — Estimate Action / Budget / Document Integration

## 1. Budget integration

- **Comparison:** GET /api/v1/projects/:id/estimate returns budget_summary (from cost.repository getBudgetSummary) alongside estimate_results. Manager sees "Recorded budget" and "Latest estimate (AI)" in one view. No automatic sync: budget is source of truth for actuals; estimate is decision-support.
- **Cost signals (Step 14):** Existing cost risk signals (over_budget, cost_pressure) are unchanged. They are based on project_cost_items only. We do not add "estimate vs budget variance" as a new signal in Step 15; optional future.

## 2. Document / image integration

- **Documents as sources:** Project documents are listed in estimate summary as source_documents (id, title, type, status). They are not parsed for content; they are visible as "sources that could be used later."
- **Image as input:** POST /api/v1/projects/:id/estimate/from-image accepts image_url. Image can be a public URL (e.g. from document upload publicUrl or report media). No automatic "run estimate on every document upload" in Step 15.

## 3. Action / intelligence integration

- **Manager action:** Estimate panel is a dedicated tab. No new priority-action or dashboard card in Step 15; manager opens project → Estimate tab to see summary and run estimate from image.
- **Missing estimate inputs:** UI states "No AI estimate yet" and "Paste an image URL and run cost estimate." We do not add a "missing estimate setup" item to the global priority actions list; optional P2.
- **Project intelligence:** Existing project intelligence (risk, evidence, recommendations) is unchanged. Optional future: mention "Estimate confidence: low" or "No estimate from images" in intelligence summary.

## 4. Approvals / documents context

- No approval workflow for estimate results. Estimate is informational. No link from document approval to estimate.

## 5. Rules

- Only integrate real signals; keep explainability explicit; no fake finance or legal pressure.
