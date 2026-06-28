# Liquid Glass Slice 1 — Live LG Marker Verification

Date: 2026-06-28

## Landing check

- URL: `https://aistroyka.ai/en`
- HTTP: **200**
- HTML size: **222,500 bytes** (~217 KB; up from the pre-LG ~182 KB recorded in the 2026-06-28 drift evidence)

## Markers searched / found in live HTML

| Marker | Count |
|--------|-------|
| `LiquidGlass` | 2 |
| `public-ambient` | 16 |
| `surface-glass` | 2 |
| **Total LG marker hits** | **18** |

(Searched set also included `PublicLiquidGlassRoot`, `PublicAmbientField`, `glass-filter`, `AppGlassRoot`, `backdrop-filter`.)

## Supporting asset

- `https://aistroyka.ai/effects/glass-filter.svg` → HTTP **200**.

## Pilot-first CTA presence (live /en)

- "Launch pilot" ×8, "Contact us" ×14 (+ "contact us" ×6), "Get presentation" ×6.

## Regression scan (live HTML)

- Fake numeric production metrics (`500+`, `12K+`, `8K+`, `45K+`): **NONE**.
- Demo-first regression (`Request demo`, `Book demo`): **NONE**.

## Result

**PASS** — Liquid Glass markers > 0 on the live public landing; pilot-first CTAs preserved; no fake metrics; supporting SVG asset served.
