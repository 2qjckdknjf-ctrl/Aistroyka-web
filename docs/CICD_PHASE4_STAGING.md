# CI/CD Phase 4 — Staging Workflow

**Date:** 2026-03-03

---

## Status

Staging is configured in **apps/web/wrangler.toml** (`[env.staging]`, name = aistroyka-web-staging). A separate workflow was added.

---

## Workflow file

**.github/workflows/deploy-cloudflare-staging.yml**

- **Trigger:** push to branch **develop**
- **Deploy:** `npx wrangler deploy --env staging`
- **Secrets:** Same as production (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
- **Concurrency:** One staging deploy at a time

---

## Branch

If you do not use a `develop` branch, either:

- Create it and push to it to trigger staging deploys, or
- Edit the workflow and change `branches: [develop]` to your staging branch (e.g. `staging` or `release/*`).

---

## Staging Worker

Worker name: **aistroyka-web-staging**. Set NEXT_PUBLIC_* (and any other vars) for this Worker in the Cloudflare Dashboard if you use a different Supabase project or app URL for staging.
