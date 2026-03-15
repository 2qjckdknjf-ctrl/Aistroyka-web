# Brand Release Truth

**Date:** 2025-03-14

---

## Asset inventory

| Path | In repo (HEAD) | On disk | Code reference |
|------|----------------|---------|----------------|
| apps/web/public/brand/aistroyka-logo.png | YES | YES | Logo.tsx, PublicHomeContent.tsx, layout.tsx, app/layout.tsx |
| apps/web/public/brand/aistroyka-icon.png | YES | YES | Logo.tsx (iconOnly) |
| apps/web/public/brand/aistroyka-logo.svg | YES | YES | README (legacy) |
| apps/web/public/brand/aistroyka-icon.svg | YES | YES | README (legacy) |
| apps/web/public/favicon.ico | YES | YES | app/layout.tsx (icons) |
| apps/web/public/favicon-32x32.png | YES | YES | app/layout.tsx (icons) |

---

## Answers

- **Assets exist:** YES — PNGs, SVGs, favicon.ico, favicon-32x32.png all present in `apps/web/public/`.
- **Committed:** YES — at HEAD on branch ops/external-setup-attempt (blobs present in git ls-tree).
- **References correct:** YES — code uses `/brand/aistroyka-logo.png`, `/brand/aistroyka-icon.png`, `/favicon.ico`, `/favicon-32x32.png`; no broken paths.

---

## Introduced in

Commit **cff3b26e** — feat(design): publish brand system, website redesign, and asset updates. That commit added aistroyka-logo.png, aistroyka-icon.png, favicon.ico, favicon-32x32.png under apps/web/public/.
