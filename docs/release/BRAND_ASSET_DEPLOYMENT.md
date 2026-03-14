# Brand Asset Deployment

## Stage B — Brand Assets Synchronization

### 3.1 Asset Files Found

| File | Path | Size | Status |
|------|------|------|--------|
| aistroyka-logo.png | apps/web/public/brand/ | ~26KB | Present |
| aistroyka-icon.png | apps/web/public/brand/ | ~26KB | Present |
| favicon.ico | apps/web/public/ | ~1.3KB | Present (PNG format with .ico ext) |
| favicon-32x32.png | apps/web/public/ | ~1.3KB | Present |

### 3.2 Canonical Paths

- Logo: `/brand/aistroyka-logo.png`
- Icon: `/brand/aistroyka-icon.png`
- Favicon: `/favicon.ico`, `/favicon-32x32.png`

### 3.3 Favicon Status

- favicon.ico is PNG data with .ico extension (file reports "PNG image data")
- Works in modern browsers; legacy ICO format could be generated with `npx to-ico favicon-32x32.png -o favicon.ico` if needed
- No change for this release; documented as caveat

### 3.4 References Verified

| Location | Reference | Valid |
|----------|-----------|-------|
| Logo.tsx | /brand/aistroyka-logo.png, /brand/aistroyka-icon.png | ✓ |
| layout.tsx | /brand/aistroyka-logo.png (OG), /favicon.ico, /favicon-32x32.png | ✓ |
| (public)/layout.tsx | baseUrl/brand/aistroyka-logo.png (schema) | ✓ |
| PublicHomeContent | /brand/aistroyka-logo.png | ✓ |
| DashboardShell | Uses Logo component | ✓ |

### 3.5 Asset Sanity

- Logo/icon ~26KB each — reasonable
- Dimensions: logo full-size, favicon 32x32
- All paths use public-root (/brand/..., /favicon.ico)

### 3.6 Unresolved Caveats

- favicon.ico is PNG-in-ico-extension; acceptable for deployment
