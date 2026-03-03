# Multi-Environment Setup Report

**Project:** AISTROYKA-WEB  
**Date:** 2026-02-23  
**Goal:** Dev / staging / production separation on Cloudflare Workers

---

## 1. Wrangler Environments

**File:** `wrangler.toml`

| Environment | Worker name | Use |
|-------------|-------------|-----|
| **Default / dev** | `aistroyka-web-dev` | Local dev Worker; `wrangler deploy` (no --env) or `cf:deploy:dev` |
| **staging** | `aistroyka-web-staging` | Staging; `wrangler deploy --env staging` or `cf:deploy:staging` |
| **production** | `aistroyka-web-production` | Production; `wrangler deploy --env production` or `cf:deploy:prod` |

Each env has its own:
- `name` (separate Worker)
- `[env.*.assets]` (same directory `.open-next/assets`)
- `[[env.*.services]]` with `WORKER_SELF_REFERENCE` pointing to that Worker’s name

Variables are **not** stored in `wrangler.toml`. Set them per Worker in Cloudflare Dashboard (Workers → *worker name* → Settings → Variables / Secrets) or use `.dev.vars` for local dev.

---

## 2. ENV Separation

| File | Purpose | Committed |
|------|---------|-----------|
| **.env.local** | Next.js local dev (dev server). | No (.gitignore) |
| **.env.staging** | Reference / CI; Wrangler does not load it. Set vars in Dashboard for `aistroyka-web-staging`. | No (.gitignore) |
| **.env.production** | Reference / CI; Wrangler does not load it. Set vars in Dashboard for `aistroyka-web-production`. | No (.gitignore) |
| **.env.example** | Template for Supabase URL/anon key. | Yes |
| **.env.staging.example** | Template for staging vars. | Yes |
| **.env.production.example** | Template for production vars. | Yes |
| **.dev.vars** | Local Wrangler/OpenNext (dev). | No (.gitignore) |
| **.dev.vars.example** | Template for .dev.vars. | Yes |

**Separation:** Only `NEXT_PUBLIC_*` and non-secret vars are used in the app. No service role or secrets in repo or in public env. Per-environment values live in Dashboard (or in local `.env.local` / `.dev.vars`).

---

## 3. Deployment Scripts

**Added to `package.json`:**

| Script | Command | Deploys to |
|--------|---------|------------|
| **cf:deploy** | `wrangler deploy` | Default = `aistroyka-web-dev` |
| **cf:deploy:dev** | `wrangler deploy --env dev` | `aistroyka-web-dev` |
| **cf:deploy:staging** | `wrangler deploy --env staging` | `aistroyka-web-staging` |
| **cf:deploy:prod** | `wrangler deploy --env production` | `aistroyka-web-production` |

**Usage:** After `bun run cf:build`, run:
- `bun run cf:deploy:staging` — staging
- `bun run cf:deploy:prod` — production

---

## 4. Staging Deploy Status

- **Command run:** `bun run cf:deploy:staging`
- **Result:** Success.
- **Worker:** aistroyka-web-staging  
- **URL:** https://aistroyka-web-staging.z6pxn548dk.workers.dev  
- **Version ID:** 69b404a7-bbc4-463b-9d48-e9883b4836bf  
- **Upload:** 30 assets, 3964.11 KiB (gzip ~832 KiB). Worker startup 25 ms.

**Next step for staging:** In Cloudflare Dashboard, set Variables for **aistroyka-web-staging** (e.g. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`) so auth and app URL work.

---

## 5. Production Impact

- **Before:** Single Worker name `aistroyka-web` (current production URL: https://aistroyka-web.z6pxn548dk.workers.dev).
- **After:** Three Workers: `aistroyka-web-dev`, `aistroyka-web-staging`, `aistroyka-web-production`. The existing **aistroyka-web** Worker is unchanged; no automatic overwrite.
- **To use "production" Worker:** Run `bun run cf:deploy:prod` to deploy to **aistroyka-web-production** (new URL, e.g. https://aistroyka-web-production.z6pxn548dk.workers.dev). Then set production vars in Dashboard for that Worker and point DNS or routing to it when ready.
- **To keep current prod URL:** Either keep using the old Worker name for production (e.g. add a separate config or script that deploys to a worker named `aistroyka-web`) or migrate traffic to `aistroyka-web-production` and deprecate `aistroyka-web`.

---

## 6. Remaining Risks

| Risk | Mitigation |
|------|------------|
| **Staging/prod vars not set** | Set in Dashboard for each Worker; use .env.*.example as checklist. |
| **Wrong env deployed** | Use only `cf:deploy:staging` and `cf:deploy:prod`; avoid plain `cf:deploy` for prod. |
| **Same build for all envs** | Single `cf:build`; env-specific behavior is via Worker vars only. For build-time env differences, add separate build steps later. |
| **Old production Worker name** | Decide whether production stays as `aistroyka-web` or moves to `aistroyka-web-production` and update docs/CI accordingly. |

---

*End of report.*
