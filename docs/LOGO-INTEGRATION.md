# Logo Integration

## Overview

Aistroyka logo is integrated on the **public site** (header) and **dashboard** (sidebar). Favicon and app metadata (title, openGraph, structured data) are updated. The implementation uses Next.js `Image` and a reusable `Logo` component.

## Assets

| Path | Purpose |
|------|---------|
| `public/brand/aistroyka-logo.svg` | Full wordmark — header and sidebar |
| `public/brand/aistroyka-icon.svg` | Icon (e.g. "A") — favicon and collapsed sidebar |
| `public/favicon.ico` | Optional; add for legacy browsers (metadata points to it) |

To use the **official PNG logo**, place `aistroyka-logo.png` in `public/brand/` and in `components/brand/Logo.tsx` set `LOGO_SRC` to `/brand/aistroyka-logo.png`.

## Component

- **`components/brand/Logo.tsx`** — `Logo({ href, height?, iconOnly?, priority?, onClick? })`. Renders a `Link` with `Image`: full logo or icon, responsive.

## Placement

- **Public header** (`components/public/PublicHeader.tsx`): logo on the left, links to `/`, `height={28}`, `priority`.
- **Dashboard sidebar** (`components/DashboardShell.tsx`): logo in sidebar header, links to `/dashboard`, `height={26}`, with `onClick={closeSidebar}` for mobile.
- **Collapsed sidebar**: pass `iconOnly` when the sidebar has a collapsed state to show the icon only.

## Metadata and favicon

- **Root layout** (`app/layout.tsx`): `metadataBase`, `title` (default + template), `description`, `openGraph` (type, locale, url, siteName, title, description, images), `icons` (SVG icon + optional favicon.ico).
- **Structured data** (`app/[locale]/(public)/layout.tsx`): `Organization` and `SoftwareApplication` (existing) with `logo` and `image` set to the brand logo URL.

## What is real vs placeholder

- **Real:** Logo component, public header and dashboard sidebar use it; metadata and openGraph; structured data with logo/image; SVG favicon.
- **Placeholder:** Current SVGs are simple wordmark and "A" icon. Replace with official assets (e.g. `aistroyka-logo.png`, `favicon.ico`) when available.
