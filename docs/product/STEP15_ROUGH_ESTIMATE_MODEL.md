# Step 15 — Rough Estimate / Cost Range Layer

## 1. Purpose

Provide a defensible rough estimate layer: what is included, what is assumed, what is missing. No fake exactness.

## 2. Estimate summary (API + UI)

- **Budget (recorded):** From project_cost_items via getBudgetSummary. Shown as "Recorded budget" with planned_total, actual_total, variance, over_budget. This is actual project data, not AI-derived.
- **Latest estimate result:** One row from project_estimate_results (latest by created_at). Can be image-derived, budget_snapshot, or assumption. Contains:
  - rough_range_min, rough_range_max (nullable)
  - currency_hint
  - confidence (low | medium | high)
  - work_categories[]
  - missing_data_reasons[]
  - assumption_notes
- **Source documents:** List of project documents (id, title, type, status) as potential future inputs. No content extraction in Step 15.

## 3. What is included / assumed / missing

- **Included:** Budget totals when cost items exist; image-derived rough range and categories when an image was analyzed; explicit confidence and missing_data_reasons from the model.
- **Assumed:** assumption_notes from the AI output (e.g. "Based on visible area only", "Assumed standard finishes"). Shown in UI.
- **Missing:** missing_data_reasons (e.g. "No scale reference", "Image shows partial view"). When no estimate result exists, UI states "No AI estimate yet" and suggests running estimate from image.

## 4. Relation to project budget

- Budget (cost items) is never overwritten by the estimate layer. Estimate is a separate intelligence block. UI clearly labels "Recorded budget" vs "Latest estimate (AI)".
- If confidence is low or rough range is null, we do not present a single "total" as if it were actual cost.

## 5. Rules

- If only rough range is defensible, show rough range (min–max band).
- If actual budget exists, always distinguish it from AI estimate.
- If confidence is low, say so explicitly.
- Do not present assumption-heavy values as actual project cost.
