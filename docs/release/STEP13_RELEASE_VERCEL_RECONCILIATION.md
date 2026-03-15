# Step 13 Release — Vercel Production Reconciliation

**Date:** 2025-03-14

---

## B1. Identification

| Item | Source / method |
|------|------------------|
| Vercel project | Repo linked to GitHub `2qjckdknjf-ctrl/Aistroyka-web`; project name per Vercel Dashboard |
| Production branch | **Must be verified in Vercel Dashboard** → Settings → Git → Production Branch |
| Latest production deployment | Vercel Dashboard → Deployments → filter Production |
| Deployment commit SHA | Shown on deployment detail |
| Expected branch for this release | `ops/external-setup-attempt` (current branch with Step 13 + reconciliation) |

**Note:** Some docs (e.g. DEPLOY_VERCEL_STATUS, REPORT-PRODUCTION-ROOT-REDIRECT-FINAL) state production is **Cloudflare** (aistroyka.ai), not Vercel. If production is Cloudflare, Vercel may serve only previews. Operator must confirm which platform serves the live production URL.

---

## B2. If production branch is wrong

- In Vercel: Settings → Git → Production Branch → set to branch that contains the intended code (e.g. `main` or `ops/external-setup-attempt`).
- If production should track `ops/external-setup-attempt`, set it and trigger a production deploy from that branch.

---

## B3. Trigger production deployment

- **Option A:** Push to the production branch (e.g. `git push origin ops/external-setup-attempt`); Vercel auto-deploys if connected.
- **Option B:** Vercel Dashboard → Deployments → Redeploy latest production, or deploy from specific commit.
- **Option C:** Promote a successful preview deployment to production if the UI allows.

---

## B4. Verify

- Deployment status: Building → Ready (or Error).
- Production deployment commit SHA matches the commit that contains Step 13 + reconciliation.
- Production URL (Vercel *.vercel.app or custom domain) serves the new build; no cached old version.

---

## Automation limit

Vercel CLI (`vercel whoami` / `vercel ls`) was not confirmed linked in this run. Production branch and latest deployment must be verified in **Vercel Dashboard**. After push, operator should confirm production deploy and commit SHA.
