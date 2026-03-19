# Step 15 — Estimate Intelligence Domain Model

## 1. Design principles

- **No fake exactness.** Estimates are rough ranges or budget snapshots; confidence and missing-data are explicit.
- **Evidence provenance.** Every estimate result has source_type and optional source_ref (document_id, media_id, etc.).
- **Distinction:** grounded evidence (budget data, extracted signals) vs inferred cost signal vs assumption-derived estimate.

## 2. Chosen entities

| Entity | Purpose |
|--------|--------|
| **Estimate result** | One record per "run" of estimate intelligence: project-scoped, source type, extracted signals, rough range, confidence, missing/assumption notes. Replaces need for a separate "estimate session" table by storing one result per source artifact (e.g. one row per image analyzed for cost). |

## 3. project_estimate_results (new table)

- **id** — uuid, primary key.
- **tenant_id**, **project_id** — scope; RLS.
- **source_type** — `image` | `budget_snapshot` | `assumption`. Distinguishes image-derived, budget-derived, or assumption-only.
- **source_ref** — optional JSON or text: e.g. `{ "document_id": "…" }`, `{ "media_id": "…" }`, or null for assumption.
- **work_categories** — optional text[] or JSONB: e.g. ["finishing", "MEP"] from image analysis.
- **rough_range_min**, **rough_range_max** — numeric; nullable. Only set when defensible (e.g. from image or assumption band).
- **currency_hint** — text, e.g. "RUB"; optional.
- **confidence** — `low` | `medium` | `high`; required.
- **missing_data_reasons** — text[] or JSONB; why estimate is uncertain.
- **assumption_notes** — text; free-form assumptions.
- **created_by** — user (nullable); **created_at**, **updated_at** — timestamps.
- **status** — optional `draft` | `generated` | `reviewed`; default `generated` for AI-generated.

**Indexes:** project_id, tenant_id, created_at.

## 4. Relationship to existing data

- **Budget:** No FK from estimate to cost_items. Budget summary is read via getBudgetSummary(projectId) and shown alongside estimate result. "Budget-derived" estimate view = display layer that shows budget summary as the only "estimate" when source_type is implicit (no row) or we create a budget_snapshot row on demand (optional). Simplest: do not create budget_snapshot rows; show budget summary from cost repository and label it "Recorded budget" in UI; estimate result table only stores image-derived (and later assumption) rows.
- **Documents:** source_ref can reference document_id when we support document-derived later; for Step 15, image source_ref may reference a document's object_path (image URL) if the document was an image file.

## 5. What we do not add

- No BOQ (bill of quantities) entity.
- No parametric takeoff or line-item takeoff from drawings.
- No invoice/payment or legal commitment from estimate.

## 6. Remaining gaps

- No document content extraction; document_id in source_ref is for future use.
- No multi-image aggregation (e.g. average of several image estimates); one image → one result.
- Currency is hint only; no conversion.
