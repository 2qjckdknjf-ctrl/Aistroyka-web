# Web brand integration report — AISTROYKA

**Date:** 2025-03-15  
**Scope:** Web app and Vercel deploy. Approved transparent brand kit (aistroyka_brand_kit 4).

---

## Files added

- `docs/release/WEB_BRAND_PRECHECK.md` — discovery, paths, current usage, risks.
- `docs/BRAND_ASSETS_WEB.md` — canonical paths, usage, replacement procedure.
- `docs/release/WEB_BRAND_VALIDATION.md` — commands run, pass/fail.
- `docs/release/WEB_BRAND_REPORT.md` — this file.

(Canonical brand assets under `apps/web/public/brand/` and root favicons were added in a prior brand integration commit; this pass adds web-specific docs and confirms integration.)

## Files modified

None in this pass. Web integration is already in place:

- **Logo component:** `apps/web/components/brand/Logo.tsx` — variants full | wordmark | icon; wordmark for header, full for sidebar/hero/auth, icon for collapsed.
- **PublicHeader:** wordmark, height 40 (desktop) / 24 (mobile), link to "/".
- **PublicHomeContent (hero):** full logo `/brand/aistroyka-logo.png`.
- **DashboardShell:** full logo in sidebar.
- **Login page:** full logo above card.
- **Root layout:** openGraph image `/brand/social/aistroyka-og.png`, icons favicon.ico, favicon-32x32.png, apple-touch-icon.png.

## Web screens updated

- **Header (public):** wordmark.
- **Hero:** full logo.
- **Dashboard sidebar:** full logo.
- **Auth (login):** full logo above title.
- **Footer:** text-only “Aistroyka” (no logo image); unchanged.

## Metadata / favicons updated

- `app/layout.tsx`: openGraph.images → `/brand/social/aistroyka-og.png` (1200×630); icons: favicon.ico, favicon-32x32.png; apple: apple-touch-icon.png.
- Public layout schema: logo and image → `${baseUrl}/brand/aistroyka-logo.png`.

## Canonical asset paths

- `apps/web/public/brand/logo/aistroyka-logo-full.png`, `.svg`
- `apps/web/public/brand/helmet/aistroyka-helmet.png`, `.svg`
- `apps/web/public/brand/wordmark/aistroyka-wordmark.png`, `.svg`
- `apps/web/public/brand/social/aistroyka-og.png`
- `apps/web/public/brand/aistroyka-logo.png`, `.svg`
- `apps/web/public/brand/aistroyka-icon.png`
- `apps/web/public/favicon.ico`, `favicon-32x32.png`, `apple-touch-icon.png`

## Validation results

- Lint: pass. Tests: 483 passed. Production build: pass.
- Key asset paths verified present. No broken refs.

## Vercel / deploy readiness

- **Config:** `apps/web/vercel.json` — installCommand and buildCommand run from repo root (npm install + build:contracts:npm, then build:web:npm). Root Directory in Vercel = `apps/web`.
- **Assets:** Next.js serves `public/` at runtime; no extra Vercel config for static files. All brand and favicon paths are under `public/` and resolve correctly.
- **Deploy risks:** None identified. Ensure `NEXT_PUBLIC_APP_URL` is set in Vercel for correct metadataBase and OG URLs.

## Unresolved issues

None.
