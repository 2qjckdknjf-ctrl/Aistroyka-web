# Logo Integration Report

Integration of the official AISTROYKA.AI logo across the entire system.

## Files Added

### Web

| Path | Description |
|------|-------------|
| `apps/web/public/brand/aistroyka-logo.png` | Full logo (PNG) |
| `apps/web/public/brand/aistroyka-icon.png` | Icon version (PNG) |
| `apps/web/public/favicon.ico` | Favicon (ICO format) |
| `apps/web/public/favicon-32x32.png` | Favicon 32×32 PNG |

### iOS

| Path | Description |
|------|-------------|
| `ios/AiStroykaManager/.../Assets.xcassets/AppLogo.imageset/` | AppLogo asset (Manager) |
| `ios/AiStroykaWorker/.../Assets.xcassets/AppLogo.imageset/` | AppLogo asset (Worker) |

### Android

| Path | Description |
|------|-------------|
| `android/AiStroykaManager/.../res/drawable/aistroyka_logo.png` | Logo drawable (Manager) |
| `android/AiStroykaWorker/.../res/drawable/aistroyka_logo.png` | Logo drawable (Worker) |

### Documentation

| Path | Description |
|------|-------------|
| `docs/BRAND_ASSETS.md` | Brand assets guide |
| `docs/LOGO_INTEGRATION_REPORT.md` | This report |

## Files Modified

### Web

| File | Changes |
|------|---------|
| `apps/web/components/brand/Logo.tsx` | Switched from SVG to PNG; use i18n `Link` for locale-aware navigation |
| `apps/web/components/public/PublicHeader.tsx` | Responsive logo (40px desktop, 24px mobile) |
| `apps/web/app/layout.tsx` | Open Graph image to PNG; favicon to ico + 32x32 PNG |
| `apps/web/app/[locale]/(public)/layout.tsx` | Structured data logo/image URLs to PNG |

### iOS

| File | Changes |
|------|---------|
| `ios/AiStroykaManager/.../ManagerLoginView.swift` | Added AppLogo image at top of form |
| `ios/AiStroykaManager/.../HomeDashboardView.swift` | Added AppLogo in toolbar |
| `ios/AiStroykaManager/.../Info.plist` | UILaunchScreen with AppLogo |
| `ios/AiStroykaWorker/.../LoginView.swift` | Added AppLogo above title |
| `ios/AiStroykaWorker/.../Info.plist` | UILaunchScreen with AppLogo |

### Android

| File | Changes |
|------|---------|
| `android/AiStroykaManager/.../ManagerApp.kt` | Added logo Image above text |
| `android/AiStroykaWorker/.../WorkerApp.kt` | Added logo Image above text |

## Screens Where Logo Appears

| Platform | Screen | Location |
|----------|--------|----------|
| Web | Public site | Header (left) |
| Web | Dashboard | Sidebar top |
| Web | Browser tab | Favicon |
| Web | Social/share | Open Graph image |
| iOS Manager | Launch | Splash (UILaunchScreen) |
| iOS Manager | Login | Top of form |
| iOS Manager | Home | Navigation bar (toolbar) |
| iOS Worker | Launch | Splash (UILaunchScreen) |
| iOS Worker | Login | Above title |
| Android Manager | Main | Above "AiStroyka Manager" text |
| Android Worker | Main | Above "AiStroyka Worker" text |

## Warnings

1. **Dashboard collapsed sidebar:** The dashboard sidebar does not currently have a collapsed state. If one is added later, use `Logo` with `iconOnly={true}` for the collapsed view.
2. **Android launcher icon:** The app launcher icon (mipmap) was not updated. To use the logo as the launcher icon, add appropriate densities to `res/mipmap-*` and update the manifest.
3. **Logo format:** The source logo was provided as PNG. Original SVG assets (`aistroyka-logo.svg`, `aistroyka-icon.svg`) remain in `public/brand/` for reference but are no longer used by the Logo component.

## Build Validation

Run from repo root:

```bash
npm run build
npx tsc --noEmit  # in apps/web
npm run lint      # in apps/web
```

Ensure no broken imports, layout crashes, or missing assets.
