# Deploy Pipeline — Phase 4: Cloudflare Status

**Date:** 2026-03-03

---

## 1. wrangler.toml

**Location:** apps/web/wrangler.toml  
**Status:** Present.

- **Production env:** `[env.production]`, worker name `aistroyka-web-production`
- **Routes:** aistroyka.ai, aistroyka.ai/*, www.aistroyka.ai, www.aistroyka.ai/* (zone aistroyka.ai)
- **Build output:** main = `.open-next/worker.js`, assets = `.open-next/assets`

---

## 2. Build and deploy commands

| Step | Command | Notes |
|------|---------|------|
| Build | `npm run cf:build` | From apps/web; runs opennextjs-cloudflare build |
| Deploy production | `npm run cf:deploy:prod` | wrangler deploy --env production |
| Full deploy | `npm run deploy:prod` | cf:build && cf:deploy:prod |

**Build root:** All commands must be run from **apps/web** (or with `working-directory: apps/web` in CI).

---

## 3. Env / secrets

Secrets are not stored in wrangler.toml. Use:

- **Local / CI:** `.dev.vars` (not committed) or env vars.
- **Cloudflare Dashboard:** Workers & Pages → aistroyka-web-production → Settings → Variables and Secrets.

**Required for runtime (names only):**
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_APP_URL (e.g. https://aistroyka.ai)

Set via Dashboard or:
```bash
cd apps/web
npx wrangler secret put NEXT_PUBLIC_SUPABASE_URL --env production
npx wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY --env production
# etc.
```

**Not run in this audit:** `wrangler secret list` (requires authenticated wrangler / Cloudflare credentials).

---

## 4. Trigger production deployment

**Option A — from repo root (after Git push):**
```bash
cd apps/web
npm run cf:build
npm run cf:deploy:prod
```

**Option B — from apps/web:**
```bash
npm run deploy:prod
```

**Not run in this audit:** Actual deploy was not executed (no Cloudflare credentials in scope). Build validation was run separately (Phase 5).

---

## 5. Production URL and version

- **Production URL (from wrangler.toml):** https://aistroyka.ai (and https://www.aistroyka.ai)
- **Deployed version / SHA:** To be confirmed after a successful deploy; compare with `git rev-parse HEAD` after pushing the branch used for deploy.

---

## Summary

| Item | Status |
|------|--------|
| wrangler.toml | Present (apps/web) |
| Build command | npm run cf:build |
| Deploy command | npm run cf:deploy:prod |
| Env/secrets | Configure in Dashboard or wrangler secret put |
| Deploy executed | No (credentials not in scope) |
