# Asset serving root cause

**Date:** 2025-03-14  
**Issue:** Production serves new page content but returns 404 for `/brand/aistroyka-logo.png`, `/brand/aistroyka-icon.png`, `/favicon.ico`.

## Build output

- A **fresh** `bun run cf:build` produces logo, icon, and favicon in `apps/web/.open-next/assets/` (see [ASSET_BUILD_OUTPUT_TRUTH.md](./ASSET_BUILD_OUTPUT_TRUTH.md)).
- The asset **copy pipeline is correct**; no bug in public → .open-next/assets.

## Root cause (two possible categories)

1. **Stale production deploy**  
   The currently live deployment was built from an earlier commit or cached build where:
   - `public/brand/*.png` or `public/favicon.ico` were not yet in the repo, or
   - `.open-next/assets` was not repopulated (e.g. cache).  
   So the uploaded Workers Static Assets did not include these files.

2. **Static asset serving / routing**  
   - Cloudflare serves static assets from the `ASSETS` binding; URL path maps to file path under the assets directory.
   - If `run_worker_first` or custom routing sends `/brand/*` or `/favicon.ico` to the Worker instead of the asset binding, the Worker may return 404 for those paths.
   - Config in use: `wrangler.deploy.toml` has `[env.production.assets] directory = ".open-next/assets"`, `binding = "ASSETS"`; no `run_worker_first` override observed in repo.

## Conclusion

- **Exact cause:** Either (A) production is running an **older deployment** whose uploaded assets did not include the new brand/favicon files, or (B) a **serving/routing** issue sends those requests to the Worker instead of the static asset binding.
- **Where it broke:** Either at **deploy time** (wrong or stale assets uploaded) or at **request time** (routing/serving config).

## Recommended fix

1. **Ensure every production deploy verifies** that required brand/favicon files exist in `.open-next/assets` after build (CI step added).
2. **Trigger a new production deploy** from current `main` (re-run "Deploy Cloudflare (Production)" or push a commit). That deploy will use a fresh build and upload the verified assets.
3. If 404s persist after a verified deploy, investigate **Cloudflare Workers Static Assets** and Worker routing for `/brand/*` and `/favicon.ico` (e.g. run_worker_first, route order).
