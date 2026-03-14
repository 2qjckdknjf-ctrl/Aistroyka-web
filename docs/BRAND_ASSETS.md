# Brand Assets

Official AISTROYKA.AI logo and icon assets for consistent branding across the platform.

## Location

All web brand assets live in:

```
apps/web/public/brand/
```

## Files

| File | Description | Usage |
|------|-------------|-------|
| `aistroyka-logo.png` | Full logo (hard hat + wordmark) | Website header, dashboard sidebar, Open Graph, structured data |
| `aistroyka-icon.png` | Icon version (same as logo, for square contexts) | Collapsed sidebar, favicon source |

## Favicon

Favicon files are in `apps/web/public/`:

- `favicon.ico` — Legacy browsers
- `favicon-32x32.png` — Modern browsers, 32×32 PNG

## Where the Logo Appears

### Web

- **Public site header** — `components/public/PublicHeader.tsx` — Left side, links to `/`
- **Dashboard sidebar** — `components/DashboardShell.tsx` — Top of sidebar, links to `/dashboard`
- **Metadata** — `app/layout.tsx` — Open Graph image, favicon
- **Structured data** — `app/[locale]/(public)/layout.tsx` — Organization and SoftwareApplication schema

### iOS

- **Manager** — `ManagerLoginView`, `HomeDashboardView` (toolbar), LaunchScreen (Info.plist)
- **Worker** — `LoginView`, LaunchScreen (Info.plist)
- **Asset catalog** — `Assets.xcassets/AppLogo.imageset/` in each app

### Android

- **Manager** — `ManagerApp.kt` — Main screen
- **Worker** — `WorkerApp.kt` — Main screen
- **Drawable** — `res/drawable/aistroyka_logo.png` in each app

## How to Update

1. Replace `aistroyka-logo.png` and/or `aistroyka-icon.png` in `apps/web/public/brand/`.
2. Regenerate favicon if needed:
   ```bash
   cd apps/web/public
   sips -z 32 32 -s format png brand/aistroyka-logo.png --out favicon-32x32.png
   npx to-ico favicon-32x32.png -o favicon.ico
   ```
3. For iOS: copy the new logo to both apps’ `Assets.xcassets/AppLogo.imageset/` and replace `aistroyka-logo.png`.
4. For Android: copy to `res/drawable/aistroyka_logo.png` in both Manager and Worker.

## Design Consistency

- **Header logo height:** 32–40px (desktop), 20–24px (mobile)
- **Sidebar logo height:** 24–32px
- **Mobile:** 20–24px

## Dark Mode

The current logo (light elements on dark blue) works on both light and dark backgrounds. If a light-background variant is needed, add `aistroyka-logo-dark.png` and update `components/brand/Logo.tsx` to switch based on theme.
