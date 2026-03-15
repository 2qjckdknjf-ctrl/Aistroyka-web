# Brand integration precheck — AISTROYKA

**Date:** 2025-03-15  
**Branch:** ops/external-setup-attempt  
**Package manager:** Bun (bun@1.2.15), workspaces: apps/web, packages/contracts

## Relevant paths

| Purpose | Path |
|--------|------|
| Root layout | `apps/web/app/layout.tsx` |
| Public site header | `apps/web/components/public/PublicHeader.tsx` |
| Public footer | `apps/web/components/public/PublicFooter.tsx` |
| Dashboard shell/sidebar | `apps/web/components/DashboardShell.tsx` |
| Brand Logo component | `apps/web/components/brand/Logo.tsx` |
| Auth layout | `apps/web/app/[locale]/(auth)/layout.tsx` |
| Login page | `apps/web/app/[locale]/(auth)/login/page.tsx` |
| Public layout (OG/schema) | `apps/web/app/[locale]/(public)/layout.tsx` |
| Hero content | `apps/web/app/[locale]/(public)/PublicHomeContent.tsx` |
| Metadata / icons | `apps/web/app/layout.tsx` (metadata, openGraph, icons) |
| iOS Manager | `ios/AiStroykaManager/` |
| iOS Worker | `ios/AiStroykaWorker/` |
| Android Manager | `android/AiStroykaManager/` |
| Android Worker | `android/AiStroykaWorker/` |

## Existing asset references

- `Logo.tsx`: `LOGO_SRC = "/brand/aistroyka-logo.png"`, `ICON_SRC = "/brand/aistroyka-icon.png"`
- `app/layout.tsx`: openGraph image `/brand/aistroyka-logo.png`, icons `/favicon.ico`, `/favicon-32x32.png`
- `PublicHomeContent.tsx`: hero image `/brand/aistroyka-logo.png`
- `(public)/layout.tsx`: schema `logo` and `image` = `${baseUrl}/brand/aistroyka-logo.png`
- `DashboardShell.tsx`: `<Logo href="/dashboard" height={26} />` in sidebar
- `PublicHeader.tsx`: `<Logo href="/" height={40} />` (desktop), `height={24}` (mobile)
- CI (deploy-cloudflare-prod): expects `.open-next/assets/brand/aistroyka-logo.png`, `aistroyka-icon.png`, `favicon.ico`, `favicon-32x32.png`

## Current public assets

- `apps/web/public/brand/`: aistroyka-logo.png, aistroyka-icon.png, aistroyka-logo.svg, aistroyka-icon.svg, README.md
- `apps/web/public/`: favicon.ico, favicon-32x32.png, _headers

## Risks before change

1. CI verifies exact paths under `.open-next/assets/`; OpenNext copies from `public/` — keep `brand/aistroyka-logo.png` and `brand/aistroyka-icon.png` (or symlinks) so CI passes.
2. No `apple-touch-icon.png` in public today; adding it is safe.
3. iOS/Android: current app icons are default/system; adding helmet assets is additive.
4. Logo component is single source for header/sidebar; adding wordmark option must remain backward compatible (fallback to full logo).
