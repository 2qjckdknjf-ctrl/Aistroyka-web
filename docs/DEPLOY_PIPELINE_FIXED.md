# Deploy Pipeline — Final Report

**Date:** 2026-03-03  
**Goal:** Restore and verify deployment pipeline so production web UI updates correctly.

---

## 1. Git remote status

| Check | Result |
|-------|--------|
| **git remote -v** | **No remote configured.** |
| **Action required** | User must provide GitHub repository URL. Then run: `git remote add origin <GITHUB_REPO_URL>` |

Pushes to GitHub are **blocked** until the remote is added. No business logic or code was changed for Git; only documentation was added.

---

## 2. Branch and push status

| Item | Value |
|------|--------|
| **Current branch** | chore/ai-memory-layer-v1 |
| **main exists** | Yes (local) |
| **Production branch** | Assumed **main** (standard). If your CI/deploy uses another branch, use that. |
| **Push performed** | **No** — blocked by missing remote. |

**After adding remote, to deploy from main:**
```bash
git checkout main
git pull origin main
git merge chore/ai-memory-layer-v1
git push -u origin main
```

Or push the current branch and point Cloudflare/CI at that branch if you deploy from a non-main branch.

---

## 3. Deploy provider

**Production deploy target: Cloudflare (Workers + OpenNext).**

| Check | Result |
|-------|--------|
| Vercel | Not used (no vercel.json, no .vercel). |
| Cloudflare | **In use.** wrangler.toml in apps/web; README and package.json describe cf:deploy:prod. |

See **docs/DEPLOY_PROVIDER_DETECTION.md** for details.

---

## 4. Build root

**Web app root: `apps/web`.**

- All install/build/deploy commands must be run from **apps/web** (or with working directory `apps/web` in CI).
- Monorepo: repo root has no Next.js app; building from root would fail.

---

## 5. Production URL

From apps/web/wrangler.toml (env.production routes):

- **https://aistroyka.ai**
- **https://www.aistroyka.ai**

---

## 6. Deployed commit SHA

**Not available.** No push was performed (no remote), and no production deploy was triggered in this run.

After you add the remote, push, and run a production deploy, the deployed SHA will be the commit that was on the branch used for that deploy. Confirm in Cloudflare Dashboard (Workers & Pages → aistroyka-web-production → Deployments) or via `wrangler deployments list --env production`.

---

## 7. Env vars checklist (names only; no secrets)

Configure in Cloudflare Dashboard (Workers & Pages → aistroyka-web-production → Settings → Variables and Secrets) or via `wrangler secret put`:

| Variable | Purpose |
|----------|---------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon key |
| NEXT_PUBLIC_APP_URL | App URL (e.g. https://aistroyka.ai) |

Optional: NEXT_PUBLIC_ENV, SUPABASE_SERVICE_ROLE_KEY (server-side).

---

## 8. What was broken

- **No Git remote:** Cannot push to GitHub; deploy pipeline (if it depends on Git) cannot see new commits.
- **Unclear deploy target:** Pipeline audit assumed Vercel; actual production is Cloudflare — now documented.
- **Build root:** If any CI or deploy was pointed at repo root instead of apps/web, builds would fail or build the wrong app — docs now state build root explicitly.

No business logic or application code was changed. Only deployment-related documentation and detection were added.

---

## 9. What was fixed / documented

1. **Phase 1 (docs/DEPLOY_GIT_RESTORE.md):** Git state recorded; missing remote and required user action (add origin) documented.
2. **Phase 2 (docs/DEPLOY_PROVIDER_DETECTION.md):** Deploy target identified as Cloudflare; Vercel ruled out.
3. **Phase 3 (docs/DEPLOY_VERCEL_STATUS.md):** Vercel marked as not used; optional settings noted if you add it later.
4. **Phase 4 (docs/DEPLOY_CLOUDFLARE_STATUS.md):** Cloudflare build/deploy commands, env/secrets, and production URL documented.
5. **Phase 5 (build validation):** From apps/web: `npm ci --legacy-peer-deps` and `npm run build` completed successfully; `.next` output present; 84 routes built. ESLint reported only warnings (no build failure).
6. **Phase 6 (this report):** Pipeline state, build root, provider, URL, env checklist, and next steps summarized.

---

## 10. What you need to do to get production updates

1. **Add Git remote (required):**
   ```bash
   git remote add origin <YOUR_GITHUB_REPO_URL>
   ```
2. **Push the branch that triggers your deploy (e.g. main):**
   ```bash
   git checkout main
   git merge chore/ai-memory-layer-v1
   git push -u origin main
   ```
3. **Trigger production deploy (Cloudflare):**
   - **Option A — manual from machine with Wrangler auth:**
     ```bash
     cd apps/web
     npm run cf:build
     npm run cf:deploy:prod
     ```
   - **Option B:** If you have CI (e.g. GitHub Actions) that runs on push to main, ensure it runs from **apps/web** and runs `npm run cf:build` then `npm run cf:deploy:prod` (or `npm run deploy:prod`), with Cloudflare API token / credentials configured.
4. **Confirm:** Open https://aistroyka.ai and verify the UI matches the commit you deployed.

---

## 11. If deployment cannot proceed

**Stopping condition:** No GitHub repository URL was provided, so the remote was not added and no push was performed.

**Required from you to proceed:**
- GitHub repository URL (e.g. `https://github.com/org/AISTROYKA.git` or `git@github.com:org/AISTROYKA.git`) so we can run `git remote add origin <URL>`.
- For Cloudflare deploy: authenticated Wrangler (e.g. `wrangler login`) or CI secrets (e.g. CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID) if you use CI to deploy.

No business logic was modified. Only deployment documentation and build validation were completed.
