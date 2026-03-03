# CI/CD Phase 5 — Environment Variables (Public Only)

**Date:** 2026-03-03

---

## Required NEXT_PUBLIC_* for runtime

The web app expects these at **runtime** (Worker environment):

| Variable | Purpose |
|----------|---------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon (public) key |
| NEXT_PUBLIC_APP_URL | App URL (e.g. https://aistroyka.ai for production) |

These are **baked into the OpenNext build** when present at build time, or can be provided as **Cloudflare Worker env vars / secrets** so the Worker reads them at runtime. OpenNext/Next.js typically inlines NEXT_PUBLIC_* at build time.

---

## Recommended approach

**Set variables in the Cloudflare Dashboard** (Workers & Pages → aistroyka-web-production → Settings → Variables and Secrets):

- Add as **Environment variables** (or **Secrets** for sensitive values) for the production Worker.
- No need to pass them from GitHub Actions; the Worker already has access to vars set in the Cloudflare project.

If you need different values per deploy (e.g. from GitHub), you could pass them as env to the build step and/or use Wrangler’s `[vars]` in wrangler.toml (non-secret) or `wrangler secret put` (secret). For typical Supabase + single production URL, **Dashboard vars are sufficient**.

---

## CI workflow

The deploy workflow (Phase 3) does **not** set NEXT_PUBLIC_* in the job. It only uses:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

So runtime config for the app (Supabase URL, anon key, app URL) is expected to be configured in Cloudflare, not in GitHub Secrets. If you prefer to inject them from CI, add them as env to the “Build (OpenNext Cloudflare)” step and ensure they are available to the Worker (e.g. via Worker env vars set in Dashboard or via wrangler.toml `[vars]`).

---

## Checklist (no secrets printed)

- [ ] NEXT_PUBLIC_SUPABASE_URL set in Cloudflare Worker (production)
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY set in Cloudflare Worker (production)
- [ ] NEXT_PUBLIC_APP_URL set in Cloudflare Worker (production), e.g. https://aistroyka.ai

For staging Worker (aistroyka-web-staging), set the same names with staging values if different.
