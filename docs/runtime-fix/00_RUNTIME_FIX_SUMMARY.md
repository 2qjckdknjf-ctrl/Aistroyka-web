# Runtime fix summary: /api/v1/health 500 and middleware-manifest

## Problem

- Deploy succeeded; site loaded; login reached the app shell.
- GET /api/v1/health returned **500**.
- Protected/server-rendered routes failed with generic Server Components errors.
- Root cause: **"Dynamic require of \"/.next/server/middleware-manifest.json\" is not supported"** in the Cloudflare Workers runtime.

## Root cause (confirmed)

- Post-build patches correctly patch **OpenNext output** (`.open-next/worker.js`, `.open-next/server-functions/default/handler.mjs`).
- Production was deploying with **`wrangler deploy --env production --config wrangler.toml`**, so Wrangler **re-bundled** the worker. The bundler injects a **top-level** `var __require = ...` at the start of the bundle that **throws** on any dynamic require. That injected `__require` is what runs when Next.js server code tries to load middleware-manifest, so the runtime threw and returned 500.
- Patching only the OpenNext artifacts is not enough; the **final bundle** produced by Wrangler must be patched before upload.

## Fix applied

1. **Production deploy flow** now uses the **patched-bundle** path:
   - `wrangler deploy --env production --dry-run --outdir .open-next/deploy` (build the bundle).
   - `node scripts/patch-bundle-require.cjs` (replace top-level `__require` in `.open-next/deploy/worker-bootstrap.js` with a stub for middleware-manifest).
   - `OPEN_NEXT_DEPLOY=true wrangler deploy --env production --no-bundle --config wrangler.deploy.toml` (upload the patched bundle and assets).

2. **CI** (`.github/workflows/deploy-cloudflare-prod.yml`): same sequence; added a step that verifies the deploy bundle contains the middleware-manifest stub before upload; added optional post-deploy check of /api/v1/health.

3. **Scripts:** Root and apps/web `cf:deploy:prod` now run the patched flow. `deploy:prod` = build + `cf:deploy:prod`.

4. **No change** to app logic or to the existing post-build patches (they remain for the non-bundled artifacts and for consistency).

## Files changed

| File | Change |
|------|--------|
| `.github/workflows/deploy-cloudflare-prod.yml` | Deploy step replaced with: dry-run → patch-bundle-require → verify stub in bundle → deploy with wrangler.deploy.toml and --no-bundle. Added /api/v1/health post-deploy check. |
| `package.json` (root) | `cf:deploy:prod` now runs dry-run, patch-bundle-require, then deploy with wrangler.deploy.toml (--no-bundle). |
| `apps/web/package.json` | `cf:deploy:prod` same patched flow; `deploy:prod` now uses `cf:deploy:prod` instead of `cf:deploy:prod:patched`. |
| `docs/runtime-fix/00_RUNTIME_FIX_SUMMARY.md` | This file. |
| `reports/runtime-fix/root-cause-verification.md` | Root cause and evidence. |
| `reports/runtime-fix/final-artifact-checks.md` | How to verify the deployed artifact is patched. |

## How to verify the fix

- **Before deploy:** From apps/web, after `cf:build` and the dry-run + patch steps, run:  
  `grep -q 'x.includes("middleware") && x.includes("manifest")' .open-next/deploy/worker-bootstrap.js`  
  Must succeed.
- **After deploy:**  
  - `curl -sS -o /dev/null -w "%{http_code}" https://aistroyka.ai/api/v1/health` → expect **200**.  
  - Protected routes and /api/v1/admin/jobs/cron-tick should no longer return 500 due to middleware-manifest.

## Patch in place

- **patch-bundle-require.cjs** (unchanged): Replaces the top-level `var __require = /* @__PURE__ */ (...)(function(x) { ... throw Error(...); });` in `.open-next/deploy/worker-bootstrap.js` with a `var __require = function(x) { if (typeof x === "string" && x.includes("middleware") && x.includes("manifest")) return { version: 3, middleware: {}, functions: {}, sortedMiddleware: [] }; ... };` so that any dynamic require of middleware-manifest in the bundle returns a stub instead of throwing.
