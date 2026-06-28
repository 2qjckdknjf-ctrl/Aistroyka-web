# Liquid Glass Slice 1 — Pre-Deploy Validation

Date: 2026-06-28
SHA validated: `c69bd40bb84968a2a47196112cd76ca0b13d8ad1`

## Validation

Pre-deploy validation was performed on the exact deployed SHA (`c69bd40`) during PR #151 post-merge validation (clean worktree from updated `main`), minutes before the production deploy completed. The production CI workflow additionally re-runs `cf:build` as part of `Deploy Cloudflare (Production)`.

| Step | Command | Result |
|------|---------|--------|
| Install | `bun install --frozen-lockfile` | PASS |
| Contracts | `bun run build:contracts` | PASS |
| i18n (scoped) | `bun run i18n:check` | PASS |
| i18n (full) | `I18N_CHECK_ALL=1 bun run i18n:check` | PASS (full-tree parity) |
| Lint | `bun run lint` | PASS |
| Tests | `bun run test -- --run` | PASS — 1546 / 1546 (298 files) |
| Build | `bun run build` | PASS |
| CF build | `bun run cf:build` | PASS — `.open-next/worker.js` generated |

## Local built marker check (pre-deploy)

- LG markers (`liquid-glass` / `surface-glass` / `public-ambient`) present in **26** server chunks under `apps/web/.next/server/app/[locale]/(public)`.
- `apps/web/public/effects/glass-filter.svg` present in build assets.

Local built LG markers present: YES.
