# Wave 3 — Deploy path truth

**Date (UTC):** 2026-03-28

## Actual serving stack for `aistroyka.ai`

- **Browser / product URL:** **`www.aistroyka.ai`** (apex redirects to `www`).
- **Edge / DNS:** Vercel DNS (`vercel-dns-017.com` CNAME on `www`).
- **HTTP fingerprint:** `server: Vercel`, `x-vercel-cache`, `x-vercel-id` on API routes.

**Canonical runtime for Wave 3 live verification** is therefore the **Vercel deployment** attached to this Git repo’s production branch/project.

## Parallel path: Cloudflare Workers

- Workflow: `.github/workflows/deploy-cloudflare-prod.yml` (push to `main`).
- **Worker name:** `aistroyka-web-production`.
- **Purpose:** OpenNext-on-Workers bundle; **not** what DNS for `www.aistroyka.ai` resolves to (Vercel wins for the public domain).
- **CI status (2026-03-28):** `cf:build` + `wrangler deploy` **succeeded** after commit `f941d0e2`; job **failed** on step **Verify pilot smoke secret** because `PILOT_SMOKE_BEARER_PRODUCTION` is **not configured** in GitHub Actions secrets.

## Canonical production deploy method for latest `main` (product domain)

1. **Merge/push to `main`** with a green **Next.js** build (Vercel build command per `vercel.json`).
2. **Optional / secondary:** Cloudflare workflow deploys the Worker for accounts that hit the `*.workers.dev` or custom routes configured in Cloudflare (not the same as Vercel DNS for `www`).

## Can deploy be executed from this environment?

- **Yes** for **Git push** (done): `f941d0e2` pushed to `main`.
- **Vercel CLI production deploy:** possible with login/token; **not required** after push — health stamp updated without manual CLI.
- **Cloudflare CLI from laptop:** would need `CLOUDFLARE_API_TOKEN` + account — **not used**; CI already deploys Worker.
