# Production runtime incident — final report

**Date:** 2026-03-15  
**Incident:** Production (https://aistroyka.ai) returns 500 on /, /api/health, /api/v1/health.  
**Broken ref:** 419bcdd9 (main).  
**Known good ref:** ed3e6b59 (brand integration).

---

## Incident summary

- Deploy and build logs were green; production Worker deploy succeeded.
- All three URLs returned 500 Internal Server Error (verified live).
- No runtime logs were captured (wrangler tail requires valid Cloudflare API token in env).
- Root cause inferred from codebase and deploy flow: **likely uncaught exception in Worker at request bootstrap** — either (1) dynamic `require` of middleware-manifest not stubbed in the deployed bundle, or (2) missing Worker env vars causing a throw before route execution.

---

## Restore path chosen

**Fix-forward (minimal, reversible):**

1. **Config:** Add `NEXT_PUBLIC_APP_URL = "https://aistroyka.ai"` to production vars in `wrangler.toml` and `wrangler.deploy.toml` so the canonical URL is always set. Document that `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set in Cloudflare Dashboard (secret) for production.
2. **Patch script:** Harden `scripts/patch-bundle-require.cjs` with a second minified pattern (two spaces) so CI bundle format variations still get patched.
3. **Rollback option:** If production does not recover after redeploy, run GitHub Actions workflow **Deploy Cloudflare (Production)** with **ref: ed3e6b59** (Run workflow → ref: `ed3e6b59`) to rebuild and redeploy the known-good ref.

---

## Root cause (inferred)

- **Exact cause:** Uncaught exception in Cloudflare Worker during request handling, before route handler runs. Most likely: **"Dynamic require of \"/.next/server/middleware-manifest.json\" is not supported"** (or similar) if the deploy bundle was not patched; alternatively, a throw in bootstrap/config when Worker env vars are missing.
- **Evidence:** (1) Health route returns 503 when Supabase env is missing (handled); 500 implies crash before handler. (2) Patch applies locally; CI may have different bundle format. (3) No app code changes between ed3e6b59 and 419bcdd9. (4) Production vars in repo had only `NEXT_PUBLIC_SUPABASE_URL`; `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_APP_URL` must be set in Dashboard.
- **Exact failing file/module (hypothesis):** Top-level `__require` in `.open-next/deploy/worker-bootstrap.js` (wrangler bundle), or code path that runs when loading middleware/Next server.

---

## Files / settings changed

- `apps/web/wrangler.toml`: added `NEXT_PUBLIC_APP_URL = "https://aistroyka.ai"` under `[env.production.vars]`.
- `apps/web/wrangler.deploy.toml`: added `NEXT_PUBLIC_APP_URL = "https://aistroyka.ai"` and comment that `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set in Dashboard.
- `apps/web/scripts/patch-bundle-require.cjs`: added second minified pattern (`minOriginal2`) so bundles with two spaces after `{` and `get:` are still patched.

---

## Secrets / vars

- **In repo (non-secret):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_APP_URL` (new).
- **Must be set in Cloudflare Dashboard for production Worker:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` (secret). Optional: other vars per `docs/ENVIRONMENT-VARIABLES.md`.

---

## Deploy action

- **Not executed in this run.** User must:
  1. Commit the changes above and push to main to trigger deploy, **or** run workflow with ref `ed3e6b59` for rollback.
  2. In Cloudflare Dashboard → Workers & Pages → **aistroyka-web-production** → Settings → Variables and Secrets, ensure **NEXT_PUBLIC_SUPABASE_ANON_KEY** is set (and optionally **NEXT_PUBLIC_APP_URL** if not relying on wrangler vars).
  3. After deploy, verify: https://aistroyka.ai/api/v1/health , https://aistroyka.ai/api/health , https://aistroyka.ai/ .

---

## Verification results (post-fix)

- **Before any redeploy:** /api/v1/health = 500, /api/health = 500, / = 500.
- **After redeploy + vars:** To be re-checked; success = all three return 200 (or / returns 200/307 and health endpoints 200).
- **workers.dev:** Not verified; same Worker serves custom domain and workers.dev.

---

## Follow-up

1. Capture production Worker runtime logs (e.g. `npx wrangler tail --env production` from `apps/web` with valid `CLOUDFLARE_API_TOKEN`) during a request to confirm exact exception.
2. If 500 persists after this fix and setting ANON_KEY: run workflow with ref **ed3e6b59** for rollback, then re-investigate with logs.
3. Consider adding a health check step in CI that fails the job if /api/v1/health does not return 200 after deploy (currently continue-on-error: true).

---

## Reports

- **Triage:** docs/release/PROD_RUNTIME_INCIDENT_TRIAGE.md  
- **Root cause:** docs/release/PROD_RUNTIME_ROOT_CAUSE_ANALYSIS.md  
- **Final report:** docs/release/PROD_RUNTIME_INCIDENT_FINAL_REPORT.md (this file).
