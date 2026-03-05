# Deploy Pipeline — Phase 3: Vercel Status

**Date:** 2026-03-03

---

## Result

**Vercel is not the production deploy target for this project.**

See **docs/DEPLOY_PROVIDER_DETECTION.md**: production is **Cloudflare** (wrangler.toml, cf:deploy:prod).

No vercel.json or .vercel directory is present. No Vercel-specific steps were run.

If a Vercel project is used for preview or alternate deployments, configure:

- **Root Directory:** `apps/web`
- **Framework preset:** Next.js
- **Production branch:** main
- **Build command:** `npm run build`
- **Env vars:** NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL
