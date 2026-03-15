# Asset build output truth

**Date:** 2025-03-14  
**Purpose:** Record whether brand and favicon static assets are present in the final OpenNext/Cloudflare build output.

## Build path used for production

- **Command (from repo root):** `bun run cf:build`
- **Effect:** Builds contracts, then runs Next.js + OpenNext Cloudflare build for `apps/web`.
- **Final static asset output:** `apps/web/.open-next/assets/`

## Verification (fresh build)

After a **fresh** `bun run cf:build` from repo root:

| Asset | In build output | Exact path |
|-------|-----------------|------------|
| Logo | **YES** | `apps/web/.open-next/assets/brand/aistroyka-logo.png` |
| Icon | **YES** | `apps/web/.open-next/assets/brand/aistroyka-icon.png` |
| Favicon | **YES** | `apps/web/.open-next/assets/favicon.ico` |
| Favicon 32×32 | **YES** | `apps/web/.open-next/assets/favicon-32x32.png` |

## Source → output pipeline

- **Source:** `apps/web/public/` (includes `public/brand/*.png`, `public/favicon.ico`, `public/favicon-32x32.png`).
- **OpenNext:** Copies `public/` contents into `.open-next/assets/` during the Cloudflare build step.
- **Deploy:** `wrangler deploy --env production --no-bundle --config wrangler.deploy.toml` uploads `.open-next/assets` to Cloudflare Workers Static Assets (binding `ASSETS`).

## Conclusion

- **Are the files present in final build output?** **YES** (for a fresh build).
- **Exact output path:** `apps/web/.open-next/assets/` (with `brand/` subdir and root favicon files).
- **Copy pipeline:** Correct; no fix needed in build/copy. If production returns 404 for these URLs, the cause is either a **stale deployment** (deployed from a build that did not include them) or **static asset serving/routing** (e.g. `run_worker_first` or path handling).
