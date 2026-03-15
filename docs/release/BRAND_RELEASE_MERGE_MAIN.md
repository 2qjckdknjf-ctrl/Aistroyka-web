# Brand Release — Merge to Main

**Date:** 2025-03-15

---

## Pre-merge check

| Check | Result |
|-------|--------|
| apps/web/public/brand/aistroyka-logo.png | Present on origin/main (git ls-tree) |
| apps/web/public/brand/aistroyka-icon.png | Present on origin/main |
| apps/web/public/favicon.ico | Present on origin/main |
| apps/web/public/favicon-32x32.png | Present on origin/main |
| Code references /brand/aistroyka-logo.png | Logo.tsx, PublicHomeContent, layout.tsx, app/layout.tsx |
| Code references /brand/aistroyka-icon.png | Logo.tsx (ICON_SRC) |
| Code references /favicon.ico | app/layout.tsx (icons) |

**Design commit on main:** cff3b26e (feat(design): publish brand system, website redesign, and asset updates) is in the history of origin/main. Main HEAD at verification: 6f3547a2.

---

## Merge / push status

The release branch **ops/external-setup-attempt** was merged into **main** in a previous release sprint; **main** has been pushed to **origin**. No additional merge or push was required in this run.

- **Merged to main:** YES
- **Pushed to origin/main:** YES
- **origin/main SHA:** 6f3547a2
