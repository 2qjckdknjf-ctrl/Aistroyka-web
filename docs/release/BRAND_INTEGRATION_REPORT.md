# Brand integration report — AISTROYKA

**Date:** 2025-03-15  
**Branch:** ops/external-setup-attempt  
**Source:** Approved brand kit (aistroyka_brand_kit 4 — transparent v2), path: `/Users/alex/Desktop/ЛОГО AISTROIKA/`

---

## Files added

- `apps/web/public/brand/logo/aistroyka-logo-full.png`, `aistroyka-logo-full.svg`
- `apps/web/public/brand/helmet/aistroyka-helmet.png`, `aistroyka-helmet.svg`
- `apps/web/public/brand/wordmark/aistroyka-wordmark.png`, `aistroyka-wordmark.svg`
- `apps/web/public/brand/social/aistroyka-og.png`
- `apps/web/public/apple-touch-icon.png`
- `ios/AiStroykaManager/.../AppIcon.appiconset/AppIcon.png`
- `ios/AiStroykaWorker/.../AppIcon.appiconset/AppIcon.png`
- `android/AiStroykaManager/src/main/res/drawable/aistroyka_helmet.png`
- `android/AiStroykaWorker/src/main/res/drawable/aistroyka_helmet.png`
- `docs/release/BRAND_INTEGRATION_PRECHECK.md`
- `docs/BRAND_ASSETS.md`
- `docs/release/BRAND_INTEGRATION_VALIDATION.md`
- `docs/release/BRAND_INTEGRATION_REPORT.md` (this file)

## Files modified

- **Web:** `apps/web/public/brand/aistroyka-logo.png`, `aistroyka-logo.svg`, `aistroyka-icon.png` (replaced from kit); `apps/web/public/favicon.ico`, `favicon-32x32.png` (replaced).
- **Components:** `apps/web/components/brand/Logo.tsx` — added `variant`: `full` | `wordmark` | `icon`; deprecated `iconOnly` in favor of `variant="icon"`.
- **Header:** `apps/web/components/public/PublicHeader.tsx` — logo uses `variant="wordmark"` (desktop 40px, mobile 24px).
- **Auth:** `apps/web/app/[locale]/(auth)/login/page.tsx` — full logo above login card title.
- **Metadata:** `apps/web/app/layout.tsx` — Open Graph image set to `/brand/social/aistroyka-og.png`; `apple-touch-icon` added to icons.
- **iOS:** `ios/AiStroykaManager/.../AppIcon.appiconset/Contents.json` and Worker equivalent — added `filename: AppIcon.png` for 1024×1024.
- **Android:** `android/AiStroykaManager/src/main/AndroidManifest.xml` and Worker — `android:icon` and `android:roundIcon` set to `@drawable/aistroyka_helmet`.

## Canonical asset locations

| Asset | Path |
|-------|------|
| Full logo | `apps/web/public/brand/logo/aistroyka-logo-full.png` (.svg); convenience `brand/aistroyka-logo.png` |
| Helmet | `apps/web/public/brand/helmet/aistroyka-helmet.png` (.svg) |
| Icon (favicon/collapsed) | `apps/web/public/brand/aistroyka-icon.png` |
| Wordmark | `apps/web/public/brand/wordmark/aistroyka-wordmark.png` (.svg) |
| OG/social | `apps/web/public/brand/social/aistroyka-og.png` |
| Favicons | `apps/web/public/favicon.ico`, `favicon-32x32.png`, `apple-touch-icon.png` |

## Web screens updated

- **Public header:** wordmark (40px desktop, 24px mobile), links to `/`.
- **Hero (PublicHomeContent):** full logo unchanged path; asset replaced with approved full logo.
- **Dashboard sidebar:** full logo (unchanged usage; asset replaced).
- **Auth login:** full logo above “Login” in card.
- **Metadata/OG:** OG image → `brand/social/aistroyka-og.png`; apple-touch-icon added.

## iOS targets updated

- **AiStroykaManager:** AppIcon.appiconset — single 1024×1024 image (approved app icon from kit).
- **AiStroykaWorker:** same.

No login/splash/dashboard logo views were changed; only app icon.

## Android targets updated

- **AiStroykaManager:** `res/drawable/aistroyka_helmet.png` added; launcher icon and roundIcon → `@drawable/aistroyka_helmet`.
- **AiStroykaWorker:** same.

## Metadata / favicons

- Root layout: `openGraph.images` → `/brand/social/aistroyka-og.png` (1200×630); `icons.apple` → `/apple-touch-icon.png`.
- Favicon and favicon-32x32 replaced from kit; both present in build output and CI check.

## Validation results

- Lint: pass. Tests: 483 passed. `bun run cf:build`: pass.
- CI asset check paths verified under `.open-next/assets/`.

## Unresolved caveats

- `aistroyka-icon.svg` in `public/brand/` is legacy (small file); can be replaced with helmet.svg later if desired.
- iOS/Android builds were not executed in this run; integration is standard and expected to build.
- Dark mode: approved transparent assets used as-is; no extra dark variant added. If contrast issues appear, consider `aistroyka_brand_kit 4` dark variants (e.g. wordmark-dark.svg, helmet-dark.svg) per docs.
