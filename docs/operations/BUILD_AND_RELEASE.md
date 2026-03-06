# Build and Release Gates

**Canonical “green build” for production deploy:** tests pass and `cf:build` succeeds.

## Required checks

| Check | Command | Purpose |
|-------|--------|--------|
| **Tests** | `npm run test` (from `apps/web`) | Unit/integration tests; no regressions. |
| **CF build** | `npm run cf:build` (from `apps/web`) | OpenNext/Cloudflare bundle; used for production deploy. |

Both must pass before merging to main or deploying. CI should run these from **apps/web** (see below).

## Optional: Next.js build

- **Command:** `npm run build` (Next.js standard build).
- **Use:** Vercel or local verification. Not required for Cloudflare production deploy.
- **Known issue:** In some environments, `next build` may hit export/500.html or other Next 14 quirks. If it is flaky, treat **cf:build** as the blocking gate and document the Next build as optional in CI.

## Where to run

- **apps/web** is the deployed application. All commands above must run with **working directory = apps/web** (e.g. `cd apps/web && npm run test` and `cd apps/web && npm run cf:build`).
- Root `package.json` may delegate `build` / `cf:build` to `apps/web`; CI should still set `working-directory: apps/web` so install and env resolve correctly.

## CI alignment

- **Lint:** `npm run lint`
- **Test:** `npm run test` (Vitest)
- **Build gate:** `npm run cf:build`

If `npm run build` (Next) is included in CI, it can be non-blocking (e.g. allow failure with a documented reason) so that the canonical gate remains **tests + cf:build**.

## cf:build dependency

- **Script:** `opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion` (see `apps/web/package.json`).
- **Requires:** The `opennextjs-cloudflare` CLI (from dependency `@opennextjs/cloudflare` in root or apps/web). If the CLI is not on PATH when running the script, install deps with `npm install --legacy-peer-deps` (or `npm ci`) in apps/web first.
