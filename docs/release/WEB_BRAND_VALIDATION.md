# Web brand validation — AISTROYKA

**Date:** 2025-03-15

## Commands run

| Command | Result |
|--------|--------|
| `bun install --frozen-lockfile` (root) | Pass |
| `bun run lint` | Pass — no ESLint errors |
| `bun run test` | Pass — 483 tests, 98 files |
| `bun run build` (contracts + apps/web) | Pass — Next.js production build completed |

## Verification

- Key asset paths exist: `public/favicon.ico`, `public/brand/social/aistroyka-og.png`, `public/brand/aistroyka-logo.png`, `public/brand/wordmark/aistroyka-wordmark.png`.
- Metadata in `app/layout.tsx`: openGraph image `/brand/social/aistroyka-og.png`, icons favicon.ico, favicon-32x32.png, apple-touch-icon.png.
- No broken imports: Logo.tsx uses `/brand/aistroyka-logo.png`, `/brand/aistroyka-icon.png`, `/brand/wordmark/aistroyka-wordmark.png`; PublicHomeContent and login use `/brand/aistroyka-logo.png`.

## Issues found

None. All checks passed.

## Fixes applied

N/A.

## Remaining unrelated pre-existing issues

- No `typecheck` script at repo root (optional; TypeScript is checked during build).
- Next.js lint deprecation notice (next lint → ESLint CLI) is informational only.
