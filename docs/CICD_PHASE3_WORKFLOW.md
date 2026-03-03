# CI/CD Phase 3 — GitHub Actions Production Workflow

**Date:** 2026-03-03

---

## Workflow file

**.github/workflows/deploy-cloudflare-prod.yml**

---

## Trigger

- **Event:** `push` to branch `main`
- **Concurrency:** One production deploy at a time (`deploy-cloudflare-prod` group); new pushes do not cancel an in-progress deploy.

---

## Job configuration

| Item | Value |
|------|--------|
| Runner | ubuntu-latest |
| Timeout | 25 minutes |
| Working directory | apps/web (all steps) |

---

## Steps

1. **Check required secrets**  
   Fails immediately with a clear error if `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_ACCOUNT_ID` is not set. No deploy is attempted without both.

2. **Checkout**  
   actions/checkout@v4

3. **Setup Node**  
   actions/setup-node@v4, node-version 20, npm cache using apps/web/package-lock.json

4. **Install dependencies**  
   `npm ci --legacy-peer-deps` (required for current peer dependency constraints)

5. **Build (OpenNext Cloudflare)**  
   `npm run cf:build` — produces .open-next/worker.js and .open-next/assets

6. **Deploy to Cloudflare (production)**  
   `npx wrangler deploy --env production` — uses [env.production] from wrangler.toml (aistroyka.ai, www.aistroyka.ai)

---

## Auth (secrets)

| Secret | Required | Purpose |
|--------|----------|---------|
| CLOUDFLARE_API_TOKEN | Yes | Wrangler auth; must have Workers edit permission |
| CLOUDFLARE_ACCOUNT_ID | Yes | Cloudflare account ID |

Secrets are passed via job `env`. The first step fails fast if either is missing.

---

## .nvmrc

No .nvmrc was found in the repo; the workflow uses Node 20. To pin a different version, add .nvmrc in the repo root or apps/web and adjust the workflow to read it (e.g. `node-version-file: 'apps/web/.nvmrc'` if you add one under apps/web).
