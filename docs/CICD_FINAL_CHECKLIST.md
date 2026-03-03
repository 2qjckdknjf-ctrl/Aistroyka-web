# CI/CD — Final Checklist and User Actions

**Date:** 2026-03-03

---

## Pipeline status after setup

- **Committed:** All CI/CD workflow files and phase docs are committed (commit: `feat(cicd): cloudflare production deploy via GitHub Actions`).
- **Push:** **Not performed** — no Git remote (`origin`) is configured. You must add the GitHub repo URL and push (see below).
- **Actions:** Will run automatically after the first push to `main` once the remote is added and secrets are set.

---

## A) GitHub secrets to add

Add these in **GitHub → Repository → Settings → Secrets and variables → Actions**:

| Secret name | Required | Description |
|-------------|----------|-------------|
| **CLOUDFLARE_API_TOKEN** | Yes | Cloudflare API token with **Workers Scripts** edit permission (and optionally Workers Routes). Create in Cloudflare Dashboard → My Profile → API Tokens → Create Token (edit Workers template). |
| **CLOUDFLARE_ACCOUNT_ID** | Yes | Your Cloudflare account ID. Found in Dashboard → Workers & Pages → overview (right sidebar) or in the URL when viewing a Worker. |

Optional (only if your setup needs them):

| Secret name | When needed |
|-------------|-------------|
| CLOUDFLARE_ZONE_ID | Only if you manage routes via API; wrangler.toml already has zone_name for aistroyka.ai. |

---

## B) Where to add secrets

1. Open your GitHub repository.
2. **Settings** → **Secrets and variables** → **Actions**.
3. **New repository secret** for each of:
   - Name: `CLOUDFLARE_API_TOKEN`, Value: (your API token).
   - Name: `CLOUDFLARE_ACCOUNT_ID`, Value: (your 32‑char account ID).

---

## C) Worker / runtime env vars (Cloudflare)

In **Cloudflare Dashboard** → **Workers & Pages** → **aistroyka-web-production** → **Settings** → **Variables and Secrets**, ensure:

- **NEXT_PUBLIC_SUPABASE_URL**
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**
- **NEXT_PUBLIC_APP_URL** (e.g. `https://aistroyka.ai`)

See **docs/CICD_PHASE5_ENV_VARS.md**.

---

## D) How to verify

1. **Add Git remote** (if not already):
   ```bash
   git remote add origin https://github.com/<org>/<repo>.git
   ```

2. **Push to main** (e.g. merge your branch and push):
   ```bash
   git checkout main
   git merge <your-branch>
   git push -u origin main
   ```

3. **GitHub Actions:** Repo → **Actions** → workflow **Deploy Cloudflare (Production)** should run. Open the run and confirm all steps succeed.

4. **Cloudflare:** Workers & Pages → aistroyka-web-production → **Deployments** — new deployment should appear with the commit SHA from the push.

5. **Live site:** Open https://aistroyka.ai and confirm the UI matches the commit you pushed.

---

## E) Rollback procedure

1. **List deployments:**
   ```bash
   cd apps/web
   npx wrangler deployments list --env production
   ```

2. **Rollback (if supported):**  
   Cloudflare Workers does not always expose a one-click rollback. Options:
   - **Redeploy previous commit:** Checkout the previous commit on main, push (or run the workflow manually), so the workflow deploys that version.
   - **Dashboard:** In Workers & Pages → aistroyka-web-production → Deployments, check if a “Rollback” or “Restore” action is available for a previous deployment.

3. **Quick revert via Git:**
   ```bash
   git revert HEAD --no-edit
   git push origin main
   ```
   The workflow will deploy the reverted commit.

---

## F) Staging (optional)

- Workflow **Deploy Cloudflare (Staging)** runs on push to **develop**.
- If you do not use `develop`, create it or change the trigger branch in `.github/workflows/deploy-cloudflare-staging.yml`.
- Staging Worker name: **aistroyka-web-staging** (from wrangler.toml). Set its env vars in the Cloudflare Dashboard for the staging Worker.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Add **CLOUDFLARE_API_TOKEN** and **CLOUDFLARE_ACCOUNT_ID** in GitHub Actions secrets. |
| 2 | Ensure production Worker has **NEXT_PUBLIC_*** vars in Cloudflare Dashboard. |
| 3 | Add Git remote and push to **main**. |
| 4 | Confirm Actions run and production deployment at https://aistroyka.ai. |
