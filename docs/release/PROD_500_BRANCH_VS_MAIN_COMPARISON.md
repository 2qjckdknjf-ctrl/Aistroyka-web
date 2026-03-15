# Production 500: branch deploy vs main deploy (419bcdd) comparison

**Goal:** Identify environment/runtime differences between a working branch deployment and the broken main production deployment at commit 419bcdd.

---

## 1. Deploy target comparison

| Aspect | Working branch deploy | Broken main deploy (419bcdd) |
|--------|------------------------|------------------------------|
| **Workflow** | Same: `.github/workflows/deploy-cloudflare-prod.yml` | Same |
| **Trigger** | `workflow_dispatch` with `ref=<branch>` or push to that branch if ever used | Push to `main` |
| **Checkout ref** | Branch ref (e.g. `ops/external-setup-attempt`) | `main` (419bcdd = merge of that branch into main) |
| **Worker name** | `aistroyka-web-production` | `aistroyka-web-production` |
| **Wrangler config** | `wrangler.deploy.toml` (env.production) | `wrangler.deploy.toml` (env.production) |
| **Deploy steps** | checkout → build → dry-run → patch → verify stub → deploy with --no-bundle | Identical |
| **Custom domain** | aistroyka.ai (routes in Dashboard) | Same |
| **workers.dev** | Same worker, same account | Same |

**Conclusion:** Deploy target is identical. Same worker, same config file, same workflow steps. No separate “staging” vs “production” for these two runs; both deploy to **aistroyka-web-production**.

---

## 2. Environment differences

| Item | Branch deploy | Main deploy (419bcdd) |
|------|----------------|------------------------|
| **URL / route** | aistroyka.ai → same worker | Same |
| **workers.dev vs production domain** | Same worker serves both; no env switch by domain in code | Same |
| **Environment name** | `production` (NEXT_PUBLIC_APP_ENV=production) | Same |
| **Wrangler [env.production.vars]** | NEXT_PUBLIC_SUPABASE_URL only (in repo) | Same |
| **Secrets / env vars** | Not in workflow. Worker vars: from wrangler. Secrets: from Cloudflare Dashboard only (NEXT_PUBLIC_SUPABASE_ANON_KEY, etc.) | Same. CI does not set NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_APP_URL; they must exist on the Worker. |
| **Build-time env (GITHUB_ENV)** | NEXT_PUBLIC_BUILD_SHA, NEXT_PUBLIC_BUILD_TIME, NEXT_PUBLIC_APP_ENV | Same |
| **Compatibility** | compatibility_date = "2024-12-30", nodejs_compat, global_fetch_strictly_public | Same |

**Conclusion:** There is no workflow or wrangler-level environment difference between the two deploys. The only variables are (1) the **code** at the checked-out ref, and (2) whatever **Worker secrets/vars** are set in Cloudflare for aistroyka-web-production (they persist across deploys and are not in the repo).

---

## 3. Likely 500 cause

- **Same target, same config** → 500 is not caused by a different deploy target or a different env name/bindings in the workflow.
- **Possible causes:**
  1. **Middleware-manifest (known past cause):** Unpatched `__require` for middleware-manifest throws in the Worker. If the **patch** did not apply to the bundle produced from 419bcdd (e.g. different Wrangler bundle format), the deployed code would still throw. The workflow has a “Verify patched bundle” step that must pass for deploy to succeed; if that step passed, the stub was present at upload time. If the step was skipped or the job was from an older workflow version without the step, an unpatched bundle could have been deployed.
  2. **Missing Worker secrets at runtime:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and optionally `NEXT_PUBLIC_APP_URL`) are **not** in wrangler.toml; they must be set in Cloudflare → Workers → aistroyka-web-production → Settings → Variables and Secrets. If they are missing or were removed, runtime code that calls `getPublicConfig()` / `getPublicEnv()` or `assertSupabasePublicEnv()` can get empty values or throw and surface as 500.
  3. **Code/merge in 419bcdd:** The merge might have introduced a path that throws (new middleware, new require, or different error handling). Less likely if the branch deploy was the same code before the merge, but possible if main had other changes.

**Most likely:** (1) Patch not applied or not verified for the 419bcdd bundle, or (2) production Worker missing **NEXT_PUBLIC_SUPABASE_ANON_KEY** (or **NEXT_PUBLIC_APP_URL** if required) in Cloudflare.

---

## 4. Exact setting/binding/secret to fix

1. **Cloudflare Dashboard → Workers & Pages → aistroyka-web-production → Settings → Variables and Secrets**
   - Ensure **NEXT_PUBLIC_SUPABASE_ANON_KEY** is set (secret or encrypted var).
   - Ensure **NEXT_PUBLIC_APP_URL** = `https://aistroyka.ai` if the app uses it (e.g. auth callbacks).
   - Optional but recommended for production: **SUPABASE_SERVICE_ROLE_KEY** for server-side/cron.

2. **If 500 is still “Dynamic require of middleware-manifest”:**
   - Re-run the production workflow from a ref where the patch is known to apply (e.g. the same branch that worked), or
   - From repo root: in `apps/web`, run `bun run cf:build`, then `npx wrangler deploy --env production --dry-run --outdir .open-next/deploy`, then `node scripts/patch-bundle-require.cjs`, then verify:  
     `grep -q 'x.includes("middleware") && x.includes("manifest")' .open-next/deploy/worker-bootstrap.js`  
   - If the pattern is not found, the patch script may need to be updated for the current Wrangler bundle format.

3. **Worker logs:** In Cloudflare Dashboard → Workers → aistroyka-web-production → Logs (Real-time or Tail), reproduce the 500 and check the exact error message (e.g. “Dynamic require” vs “Missing Supabase env” or other). That will confirm whether the fix is patch vs secrets.

---

## 5. Rollback needed yes/no

- **Yes, if:** You need production back to a working state immediately. Then: re-run **Deploy Cloudflare (Production)** via `workflow_dispatch` with **ref** = the last known good commit (e.g. the branch commit that was deployed and worked before the merge), or with **ref** = a commit before 419bcdd. That redeploys a known-good bundle to the same worker.
- **No, if:** You first fix the Worker secrets (and optionally re-verify the patch) and then redeploy from main (or from the same ref) and confirm 500 is gone. Rollback is then not required.

**Recommendation:** Check Worker logs for the 500, then either add/fix the secrets and redeploy, or rollback by deploying the last good ref, then fix secrets/patch and deploy again.
