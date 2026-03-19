# Step 15 — Market Context Foundation

## 1. Scope (foundation only)

Step 15 does not build a full country/region/city market engine or live pricing. It establishes the minimal explicit foundation for market assumptions.

## 2. What is implemented

- **Currency hint:** Estimate result has currency_hint (e.g. "RUB", "USD") from AI output. No conversion; one currency per result.
- **Assumption notes:** assumption_notes on each estimate result capture AI-stated assumptions (e.g. region, quality class). Manager-visible in Estimate panel.
- **No market profile table yet:** We do not add tenant/project "market profile" or "region" columns in this step. Optional future: tenant_settings or project-level "market_region" with a static label (e.g. "Moscow region") used only for display and for prompting.

## 3. Configurable market bands (deferred)

- Coarse geography-aware context (e.g. "RU", "EU") and configurable market bands are deferred. When added later, they will be:
  - Optional project or tenant setting
  - Used to label "market assumption" in UI and optionally to pass context to AI
  - Not used for automatic pricing lookup without a proper market engine

## 4. Manual / static reference pathway

- Today, the only "market" context is what the AI returns in currency_hint and assumption_notes. No manual price list or static reference table in Step 15.

## 5. Defer note for deeper market engine

- A full market engine (country/region/city, live or periodic pricing, quality bands) is out of scope. This foundation allows the product to expose "market assumption" and currency clearly so that a future engine can plug in without changing the estimate result shape.
