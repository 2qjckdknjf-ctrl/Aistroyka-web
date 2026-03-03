# CI/CD Phase 2 — Cloudflare Deploy Config Validation

**Date:** 2026-03-03

---

## 1. apps/web/wrangler.toml

| Item | Value |
|------|--------|
| **Production env** | `[env.production]` |
| **Worker name** | aistroyka-web-production |
| **compatibility_date** | 2024-12-30 |
| **compatibility_flags** | nodejs_compat, global_fetch_strictly_public |
| **Main** | .open-next/worker.js |
| **Assets** | .open-next/assets |

**Production routes (zone aistroyka.ai):**
- aistroyka.ai
- aistroyka.ai/*
- www.aistroyka.ai
- www.aistroyka.ai/*

**Staging env:** `[env.staging]`, name = aistroyka-web-staging (no custom routes in toml; uses Workers subdomain or custom domain if set in dashboard).

---

## 2. apps/web/package.json scripts

| Script | Command | Status |
|--------|---------|--------|
| cf:build | opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion | Present |
| cf:deploy:prod | wrangler deploy --env production | Present |
| deploy:prod | npm run cf:build && npm run cf:deploy:prod | Present |
| cf:deploy:staging | wrangler deploy --env staging | Present |
| deploy:staging | npm run cf:build && npm run cf:deploy:staging | Present |

---

## 3. Local build validation

**Commands run (from repo root, then apps/web):**

```bash
cd apps/web
npm ci --legacy-peer-deps
npm run cf:build
```

**Result:** Both succeeded.

- **npm ci:** Installed dependencies (peer dependency resolution requires `--legacy-peer-deps`).
- **npm run cf:build:** Next.js build + OpenNext Cloudflare bundle; output in `.open-next/worker.js` and `.open-next/assets`.

**Deploy was not run** (no Wrangler auth in this environment).

---

## Summary

Cloudflare production config is valid. CI must run from **working-directory: apps/web** and use `npm ci --legacy-peer-deps` and `npm run cf:build` before `npx wrangler deploy --env production`.
