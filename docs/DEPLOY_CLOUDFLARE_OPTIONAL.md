# Cloudflare Workers (optional deploy path)

**Primary production target for this repo is Vercel.** Cloudflare Workers deploy is supported as an optional path and is not required for release.

## Current state

- **Default build:** `npm run build` runs `next build` (Vercel-compatible). No OpenNext in default dependencies.
- **CF scripts (apps/web):** `cf:build`, `cf:deploy`, `cf:deploy:staging`, `cf:deploy:prod` remain in package.json but **will not work** until the OpenNext stack is re-added.

## To deploy to Cloudflare Workers

1. **Re-add OpenNext packages** (from repo root or apps/web):
   - `npm i @opennextjs/cloudflare` (in apps/web; root optional).
   - Resolves peer dependency by either:
     - Using a Next version compatible with OpenNext (e.g. next@15 or 16 per their peer range), or
     - Running with `--legacy-peer-deps` if you stay on Next 14.
2. **Restore OpenNext config** (if removed):
   - Recreate `apps/web/open-next.config.ts` with `defineCloudflareConfig` from `@opennextjs/cloudflare` (see git history or docs).
3. **Build and deploy:**
   - From apps/web: `npm run cf:build` then `npm run cf:deploy` (or `cf:deploy:staging` / `cf:deploy:prod`).
   - Wrangler uses `wrangler.toml` (main = `.open-next/worker.js`, assets = `.open-next/assets`).
4. **Environment:** Set Worker env vars in Cloudflare Dashboard (e.g. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`). See existing CF docs in repo.

## Summary

| Path        | Build command   | When to use                    |
|------------|-----------------|---------------------------------|
| **Vercel** | `npm run build` | Default; production release.   |
| **CF**     | `npm run cf:build` | Optional; requires re-adding OpenNext. |
