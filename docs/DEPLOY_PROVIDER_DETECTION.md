# Deploy Pipeline — Phase 2: Deploy Target Detection

**Date:** 2026-03-03

---

## Checks performed

| Check | Location | Result |
|-------|----------|--------|
| vercel.json | repo root, apps/web | **Not found** |
| .vercel directory | repo root, apps/web | **Not found** |
| wrangler.toml | apps/web | **Found** |
| README deploy instructions | README.md | **Cloudflare** (cf:deploy, cf:deploy:staging, cf:deploy:prod) |
| package.json scripts | apps/web/package.json | **cf:build**, **cf:deploy**, **cf:deploy:prod** |

---

## Conclusion

**Production deploy target: Cloudflare (Workers + OpenNext).**

- **Not Vercel:** No vercel.json, no .vercel, no Vercel-specific scripts or docs.
- **Cloudflare:** wrangler.toml present in apps/web with envs dev, staging, production; production routes for aistroyka.ai and www.aistroyka.ai. README and package.json describe Cloudflare deploy.

---

## Build root

- **Web app root:** `apps/web` (monorepo).
- All web build and deploy commands must be run from **apps/web** (or with working directory apps/web).

---

## Relevant config (excerpts)

**apps/web/wrangler.toml:**
- Production env: `[env.production]`, name = `aistroyka-web-production`
- Routes: aistroyka.ai, aistroyka.ai/*, www.aistroyka.ai, www.aistroyka.ai/*
- Build output: `.open-next/worker.js`, `.open-next/assets`

**apps/web/package.json:**
- `cf:build` = opennextjs-cloudflare build
- `cf:deploy:prod` = wrangler deploy --env production
- `deploy:prod` = npm run cf:build && npm run cf:deploy:prod
