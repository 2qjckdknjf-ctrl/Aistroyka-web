# Production static asset — cache / CDN check

**Date:** 2025-03-15  
**Goal:** Ensure 200 results are stable and not a local/browser false positive.

## E1. Clean fetch path

- Verify live URLs with `curl` (no browser cache). Use a fresh request: `curl -sS -o /dev/null -w "%{http_code}" -H "Cache-Control: no-cache" <url>` if needed.
- If testing in browser, use a private/incognito window or hard refresh after deploy.

## E2. Cloudflare cache purge

- **When:** Only if after a confirmed successful deploy the asset URLs still return 404 or old content, and you have verified the deployment includes the new assets (e.g. from workflow logs).
- **How:** In Cloudflare Dashboard → Caching → Configuration → Purge Everything (or purge by URL for the specific asset URLs). Prefer purge by URL to avoid broad invalidation.
- **Note:** With Workers Static Assets, the asset bundle is part of the deployment. A new deploy replaces the bundle; no separate purge is normally required for new assets to appear. Purge is only for CDN cache in front of the Worker serving stale responses.

## E3. Stability

- After a successful deploy, run the curl checks twice (or from two different networks/devices) to confirm 200 is stable and not dependent on local cache.
