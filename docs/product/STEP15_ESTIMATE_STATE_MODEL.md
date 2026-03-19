# Step 15 — Estimate State / Confidence / Missing-Data Clarity

## 1. Goal

Managers must not confuse "no data" with "cheap project" or "rough estimate" with "actual budget." States and confidence are explicit.

## 2. Project-level estimate states

| State | Condition | Meaning | UI |
|-------|-----------|--------|-----|
| No estimate inputs yet | No estimate_results; budget may or may not exist | No AI-derived estimate. | "No AI estimate yet"; suggest running estimate from image. |
| Budget only | budget_summary exists, item_count > 0; no estimate_results | Recorded budget exists; no image/assumption estimate. | Show "Recorded budget"; "No AI estimate yet." |
| Image-derived estimate | At least one result with source_type = image | AI ran on an image; rough range/confidence available. | "Latest estimate (AI)", source: image, range, confidence, missing/assumptions. |
| Assumption-heavy | confidence = low or missing_data_reasons non-empty | Estimate is uncertain; reasons shown. | Confidence and "Missing / uncertain" and "Assumptions" in panel. |

## 3. Confidence levels

- **low:** Image unclear, scope ambiguous, or not construction. Do not treat as reliable.
- **medium:** Partial visibility or typical assumptions.
- **high:** Clear scope and typical construction; still rough, not exact.

## 4. Missing / weak evidence

- **missing_data_reasons:** Array from AI (e.g. "Image shows partial view", "No scale reference"). Shown in UI.
- **Weak inputs:** We do not store "image-only" as a separate state; source_type = image implies image-only for that result. Multiple results can exist (e.g. several images over time).

## 5. Budget vs estimate

- **Budget exists but estimate missing:** Show budget; show "No AI estimate yet" for the estimate block.
- **Estimate exists but budget missing:** Show "No recorded budget yet" in budget block; show AI estimate. Never merge them into one "total" without clear labels.

## 6. No fake precision

- We do not show a single "total cost" when the only data is a rough range. We show a range and confidence. "Missing critical cost evidence" is communicated via confidence and missing_data_reasons.
