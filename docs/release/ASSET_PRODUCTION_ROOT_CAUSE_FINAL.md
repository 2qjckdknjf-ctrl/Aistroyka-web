# Production static asset 404 — root cause (final)

**Date:** 2025-03-15  
**Issue:** Production serves new page content but returns 404 for `/brand/aistroyka-logo.png`, `/brand/aistroyka-icon.png`, `/favicon.ico`.

## Evidence

- **Local build:** A fresh `bun run cf:build` produces `apps/web/.open-next/assets/brand/aistroyka-logo.png`, `aistroyka-icon.png`, `favicon.ico`, `favicon-32x32.png`. Build pipeline is correct.
- **Config:** `wrangler.deploy.toml` has `[env.production.assets] directory = ".open-next/assets"`, `binding = "ASSETS"`. No `run_worker_first` set → default is `false`.
- **Cloudflare behavior (default):** With `run_worker_first = false`, the platform serves **static assets first**. If a request matches an asset in the deployed bundle, that asset is returned. If no asset matches, the Worker is invoked (and can return 404 or fallback). So a 404 for `/brand/aistroyka-logo.png` means **no matching file exists in the deployed static asset bundle** on Cloudflare.
- **Worker routing:** The Worker is not intercepting these paths first; asset-first routing applies. So the 404 is not due to Worker logic returning 404 for `/brand/*` or `/favicon.ico`.

## Root cause classification

**Exact cause:** **Stale deploy (or single deploy packaging/upload failure).**

The deployment currently serving production was built and uploaded at a time when the `.open-next/assets` bundle **did not contain** `brand/aistroyka-logo.png`, `brand/aistroyka-icon.png`, and `favicon.ico` (or they were not uploaded). So when Cloudflare tries to serve those paths from the asset binding, no file matches and the request falls through to the Worker, which returns 404 (or the platform returns 404 for no asset match).

**Where it broke:** At **deploy time** — the asset bundle that was uploaded to Cloudflare for the live deployment did not include these files. Not a code bug, not a routing misconfiguration, not a cache issue in the sense of "correct file cached wrong"; the correct files were simply not in the bundle that was deployed.

## Ruled out

- **Missing files in repo:** No — files exist in `apps/web/public/` and are copied to `.open-next/assets` by OpenNext.
- **Build copy path:** No — local build output contains the files.
- **Worker routing intercept:** No — `run_worker_first` is not set; assets are served first.
- **Binding/config typo:** No — `ASSETS` binding and directory are correctly set.
- **Asset manifest excluding brand:** Not observed; OpenNext copies `public/` into assets. No `.assetsignore` excluding `brand/` or favicon.

## Conclusion

Trigger a **fresh production deploy** from current `main` so the asset bundle uploaded to Cloudflare includes the brand and favicon files. No code or config change to the asset pipeline or Worker is required for this fix.
