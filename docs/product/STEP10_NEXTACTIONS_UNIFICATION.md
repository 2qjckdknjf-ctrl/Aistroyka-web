# Step 10 — NextActions Unification

## Status after Step 10

**FULL** for navigation + semantics alignment; no broad UI rewrite.

## Changes

1. **Heading**: **Next actions (from AI analyses)** — distinguishes from Operations queue and tenant alerts.
2. **Subcopy**: Explains derivation from analysis history and tab links.
3. **Per-row links** via `getNextActionHref` / `getNextActionCtaLabel`:
   - Data quality / monitoring → **Uploads** tab.
   - Outlier / jump verification → **AI** tab.
   - Default strategic/health/risk items → **Intelligence** tab.
4. **Empty state**: “Not enough analysis history” + explicit separation from ops/alerts.
5. Footer **Full intelligence tab →** (secondary).

## Remaining gaps

- Title-based href mapping; if new action titles are added, extend `next-action-href.ts`.  
- Project detail route is not the same as dashboard project tabs URL — managers use dashboard links intentionally.
