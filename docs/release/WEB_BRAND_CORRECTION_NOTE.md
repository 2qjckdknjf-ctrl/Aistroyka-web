# Web brand integration — correction note

**Date:** 2025-03-15

## Why the previous commit was insufficient

The commit **`feat(brand-web): integrate approved AISTROYKA brand kit into web and Vercel assets`** (c4558042) contained **only documentation files**:

- `docs/BRAND_ASSETS_WEB.md`
- `docs/release/WEB_BRAND_PRECHECK.md`
- `docs/release/WEB_BRAND_REPORT.md`
- `docs/release/WEB_BRAND_VALIDATION.md`

It did **not** include any of the actual web implementation (assets, components, metadata, favicons). That led to the mistaken impression that the web brand integration had been committed in that step.

## Where the actual implementation lives

The **real web brand implementation** is already committed in the **previous** commit:

**`feat(brand): integrate approved AISTROYKA brand kit across project`** (ed3e6b59)

Web-related files in that commit:

| Category | Files |
|----------|--------|
| **Components** | `apps/web/components/brand/Logo.tsx` (wordmark/full/icon), `apps/web/components/public/PublicHeader.tsx` (wordmark) |
| **Pages/layout** | `apps/web/app/[locale]/(auth)/login/page.tsx` (full logo), `apps/web/app/layout.tsx` (OG, icons, apple-touch-icon) |
| **Public assets** | `apps/web/public/favicon.ico`, `favicon-32x32.png`, `apple-touch-icon.png` |
| **Brand assets** | `apps/web/public/brand/aistroyka-logo.png`, `aistroyka-logo.svg`, `aistroyka-icon.png`, `brand/logo/aistroyka-logo-full.{png,svg}`, `brand/helmet/aistroyka-helmet.{png,svg}`, `brand/wordmark/aistroyka-wordmark.{png,svg}`, `brand/social/aistroyka-og.png` |

That same commit (ed3e6b59) also contains iOS, Android, and other docs; the web implementation was never in a separate commit.

## Validation result

Re-run on current tree (no code changes in this correction):

- `bun run lint` — pass
- `bun run test` — 483 tests pass
- `bun run build` — pass

No brand-related issues. Implementation in the tree is correct and validated.

## Why no new “implementation-only” commit

Creating a new commit that “adds” the same web implementation would require either:

- Duplicating the same file changes (no-op), or  
- Rewriting history (revert ed3e6b59 and re-commit in two steps), which is **not** allowed per task rules.

So no new commit containing the implementation files was created. The implementation remains in **ed3e6b59**. This note is the only new commit (documentation) to clarify the situation.

## Final status

- **Web brand implementation:** Present and committed in **ed3e6b59**.
- **Web brand docs (precheck, assets, validation, report):** In **c4558042**.
- **This correction note:** Documents that implementation is in ed3e6b59 and c4558042 was docs-only; added in a follow-up commit.
