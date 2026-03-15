# Web brand integration precheck — AISTROYKA

**Date:** 2025-03-15  
**Scope:** Web app and Vercel deploy only.

## Package manager and scripts

- **Package manager:** Bun (root `packageManager: "bun@1.2.15"`); workspaces: `apps/web`, `packages/contracts`, `packages/contracts-openapi`.
- **Vercel flow:** Uses npm via `apps/web/vercel.json` — `installCommand`: `cd ../.. && npm install --include=dev && npm run build:contracts:npm`; `buildCommand`: `cd ../.. && npm run build:contracts:npm && npm run build:web:npm`. Root Directory in Vercel = `apps/web`.
- **Detected scripts (root):** `lint` (apps/web), `test` (apps/web), `build` (contracts + build:web), `build:web`, `build:web:npm`, `cf:build` (Cloudflare); no `typecheck` at root.

## Relevant file paths

| Purpose | Path |
|--------|------|
| Root layout (metadata, icons) | `apps/web/app/layout.tsx` |
| Public layout (schema, baseUrl) | `apps/web/app/[locale]/(public)/layout.tsx` |
| Public site header | `apps/web/components/public/PublicHeader.tsx` |
| Public footer | `apps/web/components/public/PublicFooter.tsx` |
| Homepage hero | `apps/web/app/[locale]/(public)/PublicHomeContent.tsx` |
| Dashboard shell/sidebar | `apps/web/components/DashboardShell.tsx` |
| Brand Logo component | `apps/web/components/brand/Logo.tsx` |
| Auth login | `apps/web/app/[locale]/(auth)/login/page.tsx` |
| Vercel config | `apps/web/vercel.json` |

## Current logo/icon usage

| Location | Asset | Path / usage |
|----------|--------|---------------|
| Root metadata | OG image, icons | `openGraph.images`: `/brand/social/aistroyka-og.png`; `icons`: `/favicon.ico`, `/favicon-32x32.png`; `apple`: `/apple-touch-icon.png` |
| Public layout (schema) | logo, image | `${baseUrl}/brand/aistroyka-logo.png` |
| PublicHeader | wordmark | `<Logo variant="wordmark" height={40\|24} />` → `/brand/wordmark/aistroyka-wordmark.png` |
| PublicHomeContent (hero) | full logo | `<Image src="/brand/aistroyka-logo.png" />` |
| DashboardShell | full logo | `<Logo href="/dashboard" height={26} />` → `/brand/aistroyka-logo.png` |
| Login page | full logo | `<Image src="/brand/aistroyka-logo.png" />` above card |
| Logo component | full, wordmark, icon | `LOGO_SRC`=/brand/aistroyka-logo.png, `WORDMARK_SRC`=/brand/wordmark/..., `ICON_SRC`=/brand/aistroyka-icon.png |

## Current public assets (pre-check)

- `apps/web/public/favicon.ico`, `favicon-32x32.png`, `apple-touch-icon.png`
- `apps/web/public/brand/aistroyka-logo.png`, `aistroyka-logo.svg`, `aistroyka-icon.png`, `aistroyka-icon.svg`
- `apps/web/public/brand/logo/aistroyka-logo-full.png`, `aistroyka-logo-full.svg`
- `apps/web/public/brand/helmet/aistroyka-helmet.png`, `aistroyka-helmet.svg`
- `apps/web/public/brand/wordmark/aistroyka-wordmark.png`, `aistroyka-wordmark.svg`
- `apps/web/public/brand/social/aistroyka-og.png`

## Risks before change

1. **Vercel:** Next.js copies `public/` into build output; no extra config needed for static assets. Ensure no metadata or code points to missing paths.
2. **Middleware:** `middleware.ts` allows `favicon.ico` and image extensions; brand paths under `/brand/*` are served as static.
3. **Schema/OG:** Public layout and root layout use absolute URLs (metadataBase); ensure `NEXT_PUBLIC_APP_URL` is set on Vercel for correct OG URLs.
4. **No broken refs:** All current refs point to existing files; normalization should only add/align paths, not remove working ones.
