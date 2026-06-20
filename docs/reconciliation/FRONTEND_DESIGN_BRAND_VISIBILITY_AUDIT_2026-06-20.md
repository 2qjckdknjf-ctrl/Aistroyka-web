# Frontend Design / Brand Visibility Audit — 2026-06-20

## Current Branch
- Brand assets present: YES
  - `apps/web/public/brand/aistroyka-logo.svg`
  - `apps/web/public/brand/aistroyka-icon.svg`
  - `apps/web/public/brand/logo/aistroyka-logo-full.svg`
  - `apps/web/public/brand/wordmark/aistroyka-wordmark.svg`
- Logo visible public: YES, `PublicHeader` uses `Logo`.
- Logo visible dashboard: YES, `DashboardShell` uses `Logo`.
- Design system unified: PARTIAL. Core `components/ui/*` exists and token classes are used, but full Liquid Glass system is outside current branch.
- Liquid Glass in current branch: PARTIAL/NO. There are tokens and current AISTROYKA styling, but not the external `components/design/liquid-glass/*` system.
- Liquid Glass only outside current branch: YES/PARTIAL, in `release/web-pilot-rc`, `design/liquid-glass-public-shell-lg2a`, and `feature/unified-product-design-certification`.

## External Design Assets
- Liquid Glass components:
  - `GlassButton`
  - `GlassHeroCard`
  - `GlassIntensityControl`
  - `GlassNav`
  - `GlassPanel`
  - `GlassSurface`
  - `LiquidGlass`
  - `LiquidGlassFilter`
  - `AppGlassRoot`
- Styles/assets:
  - `apps/web/styles/liquid-glass.css`
  - `apps/web/public/effects/glass-filter.svg`

## Safest Next Design Integration Slice
- Do not start with full Liquid Glass shell.
- First audit/port candidate should be public header/home/brand baseline or dashboard navigation reachability, not a full design-system swap.
- If design is chosen later, use `release/web-pilot-rc` as primary source and `design/liquid-glass-public-shell-lg2a` as reference.

## Verdict
- Current brand is visible but not the expected external Liquid Glass redesign.
- The visible redesign the user likely expects is outside current branch.
