# Production deployment truth — static assets

**Date:** 2025-03-15  
**Goal:** Establish what is currently serving aistroyka.ai and whether the latest main build is live.

## A1. Current Cloudflare production deploy path

- **Domain:** https://aistroyka.ai
- **Platform:** Cloudflare Workers (not Vercel). Worker name: `aistroyka-web-production`.
- **Deploy path:** GitHub Actions workflow "Deploy Cloudflare (Production)" (`.github/workflows/deploy-cloudflare-prod.yml`).
- **Trigger:** Push to branch `main`. Optionally `workflow_dispatch` for manual re-run.
- **Build:** From repo root: `bun run cf:build` (OpenNext Cloudflare build for `apps/web`).
- **Deploy:** From `apps/web`: `npx wrangler deploy --env production --no-bundle --config wrangler.deploy.toml`. Uses `.open-next/assets` and `.open-next/deploy/worker-bootstrap.js`.

## A2. Latest production deployment

- **Source of truth:** GitHub Actions → "Deploy Cloudflare (Production)" runs. Latest run and commit SHA are visible in the Actions tab.
- **At audit time:** Local `origin/main` at commit `6f3547a2` (design/brand and asset verification step are on main). The commit that contains brand assets in repo and the CI step that verifies `.open-next/assets` contains logo/icon/favicon is on main.

## A3. Whether latest deployment includes brand assets

- **Repo/build:** Main contains design release; a fresh `bun run cf:build` produces `brand/aistroyka-logo.png`, `brand/aistroyka-icon.png`, `favicon.ico`, `favicon-32x32.png` in `.open-next/assets`. CI step "Verify brand and favicon assets in build output" fails the job if any are missing.
- **Production 404 at audit:** Live requests to `/brand/aistroyka-logo.png`, `/brand/aistroyka-icon.png`, `/favicon.ico` returned 404. So either (1) the deploy currently serving production was from a build/commit before these assets were in the bundle, or (2) the asset upload from the last successful deploy did not include them (e.g. cache, path, or packaging issue).

## A4. Stale deploy conclusion

- **Verdict:** Production is serving a deployment whose **uploaded static asset bundle does not include** the brand and favicon files. So the issue is **stale deploy** (or a one-off packaging/upload failure on the deploy that is live).
- **Required fix:** Trigger a **fresh production deploy** from current `main` so that the build runs with the verified asset step and the new asset bundle (including `brand/` and favicon) is uploaded to Cloudflare.
- **How to trigger:** Push to `main` (e.g. after merging the workflow_dispatch and any doc changes), or run "Deploy Cloudflare (Production)" manually via Actions → workflow_dispatch if that trigger is present on main.
