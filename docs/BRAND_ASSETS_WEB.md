# Brand assets (web) — AISTROYKA

Canonical asset paths and usage for the web app. Use only approved transparent assets from the final brand kit. Do not redraw, recolor, or change proportions.

## Canonical asset files

| Asset | Path | Intended usage |
|-------|------|----------------|
| Full logo (helmet + wordmark) | `apps/web/public/brand/logo/aistroyka-logo-full.png`, `.svg` | Hero, auth, expanded sidebar, schema; reference copy at `brand/aistroyka-logo.png` |
| Convenience full logo | `apps/web/public/brand/aistroyka-logo.png`, `.svg` | Used by Logo component (full), hero, login, schema |
| Helmet only | `apps/web/public/brand/helmet/aistroyka-helmet.png`, `.svg` | Favicon source, app icon source, collapsed sidebar, compact places |
| Icon (square, from helmet) | `apps/web/public/brand/aistroyka-icon.png` | Favicon, collapsed sidebar, compact UI |
| Wordmark only | `apps/web/public/brand/wordmark/aistroyka-wordmark.png`, `.svg` | Website header |
| Open Graph / social | `apps/web/public/brand/social/aistroyka-og.png` | og:image, twitter:image (1200×630) |
| Favicon | `apps/web/public/favicon.ico` | Browser tab |
| Favicon 32px | `apps/web/public/favicon-32x32.png` | PWA / high-DPI |
| Apple touch icon | `apps/web/public/apple-touch-icon.png` | iOS home screen |

## Usage by screen

- **Header:** wordmark — `/brand/wordmark/aistroyka-wordmark.png` (desktop ~40px, mobile ~24px height).
- **Hero:** full logo — `/brand/aistroyka-logo.png`.
- **Dashboard sidebar:** full logo — `/brand/aistroyka-logo.png`.
- **Auth (login/register):** full logo — `/brand/aistroyka-logo.png`.
- **Metadata / OG:** `/brand/social/aistroyka-og.png` for social; root layout icons: favicon.ico, favicon-32x32.png, apple-touch-icon.png.

## Replacement procedure for future updates

1. Replace files in `apps/web/public/brand/` (and subfolders) and `favicon.ico`, `favicon-32x32.png`, `apple-touch-icon.png` with new approved assets. Keep the same filenames and paths so code and metadata do not break.
2. Do not remove or rename files that are referenced in code or metadata (see WEB_BRAND_PRECHECK.md and this doc).
3. Run `npm run build:web:npm` (or from root with vercel.json flow) and confirm build succeeds; verify favicon and OG in browser/devtools.
4. On Vercel, next deploy will include updated `public/` assets automatically.
