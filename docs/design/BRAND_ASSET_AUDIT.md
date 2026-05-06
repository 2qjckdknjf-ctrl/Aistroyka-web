# Brand Asset Audit

## Scope

- Web public brand assets, favicon, apple icon, OG image
- Brand references in web code and metadata
- iOS app icons and accent color assets
- Android launcher/drawable assets

## Canonical Asset Paths (Verified)

- `apps/web/public/brand/aistroyka-logo.png`
- `apps/web/public/brand/aistroyka-icon.png`
- `apps/web/public/brand/wordmark/aistroyka-wordmark.png`
- `apps/web/public/brand/logo/aistroyka-logo-full.png`
- `apps/web/public/brand/helmet/aistroyka-helmet.png`
- `apps/web/public/brand/social/aistroyka-og.png`
- `apps/web/public/favicon.ico`
- `apps/web/public/favicon-32x32.png`
- `apps/web/public/apple-touch-icon.png`

## Asset Health Checks

## Web file presence and size sanity

- `aistroyka-logo.png` ~54 KB
- `aistroyka-icon.png` ~5.6 KB
- `aistroyka-wordmark.png` ~24 KB
- `aistroyka-og.png` ~38 KB
- `favicon.ico` ~7.8 KB
- `favicon-32x32.png` ~1.2 KB
- `apple-touch-icon.png` ~8.4 KB

All audited assets are present, readable, and not abnormally large.

## Mobile asset presence

- iOS Manager `AppIcon.png` present
- iOS Worker `AppIcon.png` present
- Android Manager `drawable/aistroyka_helmet.png` present
- Android Worker `drawable/aistroyka_helmet.png` present

## Reference Consistency Checks

- `Logo` component references `/brand/*` paths (valid).
- Public structured data (`Organization` / `SoftwareApplication`) references `/brand/aistroyka-logo.png` (valid).
- Layout metadata references favicon + apple-touch icon paths (valid).

## Issues Found and Resolution

## 1) Public header logo usage mismatch

- Problem: Public header used text wordmark ("AISTROYKA") instead of canonical logo asset.
- Fix: switched to `Logo` component usage with `wordmark` (desktop) and `icon` (mobile).
- File: `apps/web/components/public/PublicHeader.tsx`.

## 2) Auth parity mismatch

- Problem: Login had logo, register did not.
- Fix: added canonical logo block to register page.
- File: `apps/web/app/[locale]/(auth)/register/page.tsx`.

## 3) iOS accent brand drift risk

- Problem: `AccentColor.colorset` had no explicit color components.
- Fix: set explicit canonical yellow (`#F5C518`) in Manager and Worker accent assets.
- Files:
  - `ios/AiStroykaManager/AiStroykaManager/Assets.xcassets/AccentColor.colorset/Contents.json`
  - `ios/AiStroykaWorker/AiStroykaWorker/Assets.xcassets/AccentColor.colorset/Contents.json`

## Duplicates / Legacy Variants

- SVG and PNG variants coexist (expected for web flexibility and legacy compatibility).
- No deletion performed in this sprint to avoid accidental runtime reference regressions.

## Audit Verdict

- Brand asset structure is valid and mostly consistent.
- High-impact display-path mismatches were fixed.
- Remaining cleanup opportunity: explicit deprecation map for unused SVG/PNG duplicates after reference tracing.
