# Production deploy workflow notes

**Date:** 2026-03-03

---

## Workflow file

**Path:** `.github/workflows/deploy-cloudflare-prod.yml`  
**Name:** Deploy Cloudflare (Production)

---

## Trigger

- **Event:** `push`  
- **Branches:** `main`  
- **Condition:** Any push to the `main` branch triggers the workflow.

---

## Behavior

1. **Checkout** repository (actions/checkout@v4).
2. **Working directory:** `defaults.run.working-directory: apps/web` — all run steps execute from `apps/web`.
3. **Build stamp:** `NEXT_PUBLIC_BUILD_SHA=${{ github.sha }}` and `NEXT_PUBLIC_BUILD_TIME` set before build so the deployed app reports the commit SHA (first 7 chars as sha7).
4. **Build:** `npm run cf:build` (OpenNext for Cloudflare).
5. **Deploy:** `npx wrangler deploy --env production --config wrangler.toml` → deploys to worker **aistroyka-web-production**.

---

## How to verify deploy

- **GitHub Actions:** Repo → Actions → "Deploy Cloudflare (Production)" — open the run for the push that updated main; confirm job "Build and deploy to production" completed successfully.
- **Cloudflare Dashboard:** Workers & Pages → aistroyka-web-production → Deployments — latest deployment should show timestamp after the push.
- **Production health:** Run `scripts/verify-prod-health.sh` (or `curl -sS https://aistroyka.ai/api/health`). Expect `buildStamp.sha7` = commit SHA (e.g. 52fb3de) and `serviceRoleConfigured` present.

---

## Note

If GitHub Actions cannot be queried from this environment, verify via the GitHub web UI or CLI (`gh run list --workflow=deploy-cloudflare-prod.yml --limit 5`).
