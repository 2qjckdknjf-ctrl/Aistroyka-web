# Production runtime root cause analysis

**Date:** 2026-03-15  
**Broken ref:** 419bcdd9 (merge of ops/external-setup-attempt into main).  
**Known good ref:** ed3e6b59 (brand integration).

## A. ENV / SECRETS

**Status:** FAIL (cannot fully verify without Cloudflare Dashboard).

**Evidence:**
- `wrangler.toml` and `wrangler.deploy.toml` [env.production.vars] contain only `NEXT_PUBLIC_SUPABASE_URL`.
- `docs/ENVIRONMENT-VARIABLES.md` and health/config code require: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`.
- Health controller uses `getPublicConfig()` and `hasSupabaseEnv()`; missing anon key yields 503 with reason `missing_supabase_env`, not 500, so 500 likely occurs before the handler runs.
- If Worker vars are missing, runtime could throw in a code path that runs before the health route (e.g. middleware or server init).

**Conclusion:** Production Worker must have `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_APP_URL` set (Dashboard or secrets). Their absence may contribute to or expose a bootstrap crash; 500 suggests an uncaught exception before route logic.

---

## B. RUNTIME PATCH / OPENNEXT

**Status:** PASS locally; UNKNOWN in CI for 419bcdd9.

**Evidence:**
- Local `wrangler deploy --dry-run --outdir .open-next/deploy` produces a bundle that contains the exact `__require` pattern targeted by `patch-bundle-require.cjs`.
- Local run of `node scripts/patch-bundle-require.cjs` succeeds; `grep 'x.includes("middleware") && x.includes("manifest")' .open-next/deploy/worker-bootstrap.js` succeeds.
- CI step "Verify patched bundle (middleware-manifest stub present)" would fail if the patch were skipped; user reported green build, so either patch applied in CI or verification is not run on the same artifact that is deployed.
- Bundle contains `__require(this.middlewareManifestPath)` (line 177645); patched `__require` stubs when path includes "middleware" and "manifest", so that path is covered.

**Conclusion:** Patch is correct and applies locally. If CI uses a different wrangler/bundle format, patch could skip (exit 0) and an unpatched bundle could be deployed; or another dynamic require could throw. Without runtime logs, root cause is inferred: **likely "Dynamic require of ... middleware-manifest ... is not supported" or similar in the deployed bundle.**

---

## C. CODE REGRESSION

**Status:** PASS (no runtime-relevant code change between refs).

**Evidence:**
- `git diff ed3e6b59..419bcdd9` shows only: `android/` (gradle, gitignore), `docs/` (brand docs). No changes to `apps/web`, `.github/workflows`, or wrangler config.
- Same middleware, layout, config, patch script, and deploy flow in both refs.

**Conclusion:** 500 is not caused by a code regression between ed3e6b59 and 419bcdd9. Failure is likely environment, build artifact, or Worker state.

---

## D. DOMAIN / CACHE / ROUTING

**Status:** UNKNOWN (workers.dev not verified).

**Evidence:**
- Custom domain (https://aistroyka.ai) returns 500 for /, /api/health, /api/v1/health.
- If workers.dev also returns 500, the issue is runtime/bootstrap, not domain or cache.

**Conclusion:** Assume both fail until proven otherwise; focus on runtime and Worker config.

---

## Summary

| Class            | Status | Conclusion |
|-----------------|--------|------------|
| ENV / SECRETS   | FAIL   | Set NEXT_PUBLIC_SUPABASE_ANON_KEY and NEXT_PUBLIC_APP_URL in production Worker. |
| RUNTIME PATCH   | PASS*  | Patch applies locally; possible patch skip or other require in CI/production. |
| CODE REGRESSION| PASS   | No app changes between good and broken ref. |
| DOMAIN / CACHE  | —      | Not isolated; treat as runtime until verified. |

**Recommended restore:**  
1. **Rollback:** Run Deploy Cloudflare (Production) workflow with ref **ed3e6b59** to rebuild and redeploy.  
2. **Worker vars:** In Cloudflare Dashboard → Workers & Pages → aistroyka-web-production → Settings → Variables and Secrets, ensure **NEXT_PUBLIC_SUPABASE_ANON_KEY** and **NEXT_PUBLIC_APP_URL** (e.g. `https://aistroyka.ai`) are set.  
3. **Re-verify:** After rollback and/or var fix, confirm /api/v1/health, /api/health, and / return 200.
