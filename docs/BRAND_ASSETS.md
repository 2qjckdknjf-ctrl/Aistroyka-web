# Brand assets — AISTROYKA

Canonical locations and usage. Source of truth: approved brand kit (transparent v2).

## Canonical files

| Asset | Path | Use |
|-------|------|-----|
| Full logo (helmet + wordmark) | `apps/web/public/brand/logo/aistroyka-logo-full.png` (.svg) | Hero, auth, expanded sidebar, OG |
| Convenience full logo | `apps/web/public/brand/aistroyka-logo.png` (.svg) | Same; used by Logo component for non-wordmark. |
| Helmet only | `apps/web/public/brand/helmet/aistroyka-helmet.png` (.svg) | App icon, collapsed sidebar, favicon source. |
| Icon (square, for favicon/collapsed) | `apps/web/public/brand/aistroyka-icon.png` | Favicon, collapsed sidebar, app icon. |
| Wordmark only | `apps/web/public/brand/wordmark/aistroyka-wordmark.png` (.svg) | Website header when space allows. |
| Open Graph / social | `apps/web/public/brand/social/aistroyka-og.png` | og:image, twitter:image. |
| Favicon | `apps/web/public/favicon.ico` | Browser tab. |
| Favicon 32px | `apps/web/public/favicon-32x32.png` | PWA / high-DPI. |
| Apple touch icon | `apps/web/public/apple-touch-icon.png` | iOS home screen. |

## Where each asset is used

- **Header (public site):** wordmark (`/brand/wordmark/aistroyka-wordmark.png`) — desktop 40px height, mobile 24px.
- **Hero / landing:** full logo (`/brand/aistroyka-logo.png`).
- **Dashboard sidebar:** full logo (`/brand/aistroyka-logo.png`).
- **Dashboard collapsed / topbar icon:** helmet/icon (`/brand/aistroyka-icon.png`).
- **Auth (login/register):** full logo above card title.
- **Metadata / OG:** `brand/social/aistroyka-og.png` for social; root metadata icons point to favicon, favicon-32x32, apple-touch-icon.

## Update procedure

1. Replace files in `apps/web/public/brand/` (and subdirs) and `apps/web/public/favicon*`, `apple-touch-icon.png` with new approved assets. Do not change filenames that are referenced in code or CI.
2. CI expects `brand/aistroyka-logo.png` and `brand/aistroyka-icon.png` under build output; keep these paths.
3. Run `bun run cf:build` and verify `.open-next/assets/brand/` contains logo and icon.
