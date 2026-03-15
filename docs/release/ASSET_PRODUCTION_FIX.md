# Production static asset fix

**Date:** 2025-03-15  
**Root cause:** Stale deploy — the live deployment’s uploaded asset bundle does not include brand and favicon files.

## Minimal correct fix

1. **Trigger a fresh production deploy** from current `main`, so that:
   - The workflow runs `bun run cf:build` (which includes the verified brand/favicon in `.open-next/assets`).
   - The "Verify brand and favicon assets in build output" step passes.
   - `wrangler deploy --env production --no-bundle --config wrangler.deploy.toml` uploads the new `.open-next/assets` (including `brand/` and favicon) to Cloudflare.

2. **Operational improvement (no product change):** Add `workflow_dispatch` to the "Deploy Cloudflare (Production)" workflow so a deploy can be re-run manually without a new push to `main`. This allows re-deploying for asset/cache refresh or after fixing CI without a dummy commit.

## What was changed

- **`.github/workflows/deploy-cloudflare-prod.yml`:** Added `workflow_dispatch:` under `on:` so the workflow can be run from the Actions tab. Pushing this change to `main` also triggers a deploy (via `push: branches: [main]`).

No changes to:
- wrangler config (asset directory or binding)
- OpenNext build
- Worker code
- Asset paths or names

## How to apply

- **Option A:** Push the workflow change (and any docs) to `main`. The push will trigger "Deploy Cloudflare (Production)". Wait for the run to complete, then verify live URLs.
- **Option B:** If the workflow with `workflow_dispatch` is already on `main`, go to GitHub → Actions → "Deploy Cloudflare (Production)" → "Run workflow" (main), then verify after completion.

After a successful run, the new asset bundle (with brand and favicon) will be live and `/brand/aistroyka-logo.png`, `/brand/aistroyka-icon.png`, `/favicon.ico` should return 200.
