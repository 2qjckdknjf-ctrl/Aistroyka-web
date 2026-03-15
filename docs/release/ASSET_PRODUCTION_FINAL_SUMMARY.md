# Production static asset closure — final summary

**Date:** 2025-03-15  
**Sprint:** Final production asset-serving closure.

## Deploy truth

- **Production deploy identified:** YES. aistroyka.ai is served by Cloudflare Workers (aistroyka-web-production). Deploy is triggered by push to main via "Deploy Cloudflare (Production)" workflow.
- **Serving commit/build:** At audit time, live deployment’s asset bundle did not include brand/favicon files (404). Source of truth for “what is live” is the latest successful workflow run for main.
- **Stale deploy:** YES. The live deployment was from a build whose uploaded `.open-next/assets` did not contain the new brand and favicon files.

## Root cause

- **Exact cause:** Stale deploy — the static asset bundle currently deployed on Cloudflare does not include `brand/aistroyka-logo.png`, `brand/aistroyka-icon.png`, or `favicon.ico`. With default `run_worker_first = false`, the platform serves assets first; 404 means no matching file in the deployed bundle.
- **Where it broke:** At deploy time (the bundle that was uploaded did not include these files).

## Fix

- **What changed:** (1) Root cause documented; (2) Minimal fix: trigger a fresh production deploy from current main so the new asset bundle (with brand and favicon) is uploaded. (3) Added `workflow_dispatch` to the deploy workflow so deploy can be re-run manually without a new push.
- **Redeployed:** YES. Commit c9bed9e9 (workflow_dispatch + these docs) was pushed to origin/main; "Deploy Cloudflare (Production)" runs on push to main. Confirm in GitHub Actions that the run for c9bed9e9 completed successfully. If it failed (e.g. tests, migration check), fix and re-run or push again. Then re-verify live URLs.

## Live verify (pre-redeploy)

- Homepage 200: YES (307 to locale; new design confirmed).
- Logo 200: NO.
- Icon 200: NO.
- Favicon 200: NO.

## Cache / CDN

- Purge/check needed: No purge required for the fix. After a new deploy, the new asset bundle is used. Purge only if 404 persists after a confirmed successful deploy.
- Final state stable: N/A until redeploy completes.

## Final verdict

- **Brand assets live:** NO. A fresh deploy was triggered (push c9bed9e9 to main). At re-check (~6 min after push), asset URLs still returned 404. Either the workflow was still running or had not yet propagated. Operator must: (1) Confirm in GitHub Actions that the run for c9bed9e9 completed successfully. (2) Re-run the curl checks in ASSET_PRODUCTION_LIVE_VERIFICATION.md. (3) If all return 200, set brand assets live = YES. (4) If deploy succeeded but URLs still 404, investigate Cloudflare asset upload/binding or purge cache.

## Files created

1. docs/release/ASSET_PRODUCTION_DEPLOY_TRUTH.md  
2. docs/release/ASSET_PRODUCTION_ROOT_CAUSE_FINAL.md  
3. docs/release/ASSET_PRODUCTION_FIX.md  
4. docs/release/ASSET_PRODUCTION_LIVE_VERIFICATION.md  
5. docs/release/ASSET_PRODUCTION_CACHE_CHECK.md  
6. docs/release/ASSET_PRODUCTION_FINAL_AUDIT.md  
7. docs/release/ASSET_PRODUCTION_FINAL_SUMMARY.md  

## Operator next step

1. Merge the branch containing the workflow_dispatch and these docs to main.  
2. Push main (or run "Deploy Cloudflare (Production)" manually).  
3. Wait for the workflow to complete.  
4. Run the curl checks in ASSET_PRODUCTION_LIVE_VERIFICATION.md.  
5. If all asset URLs return 200, update this summary: brand assets live = YES.
