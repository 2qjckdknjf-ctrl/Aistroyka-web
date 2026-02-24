# Aistroyka — AI Construction Intelligence Platform

## Overview

Next.js 14 (App Router) monolith deployed to Cloudflare Workers. Uses Supabase for auth, database, and storage. No separate backend service.

## Cursor Cloud specific instructions

### Quick reference

| Action | Command |
|--------|---------|
| Install deps | `npm install --legacy-peer-deps` |
| Dev server | `npm run dev` (port 3000) |
| Build | `npm run build` |
| Lint | `npx eslint . --ext .ts,.tsx,.js` |
| Health check | `curl http://localhost:3000/api/health` |

### Gotchas

- **Peer dep conflict**: `@opennextjs/cloudflare` requires Next 15+/16+ but the project pins Next 14.2.18. You must use `npm install --legacy-peer-deps` (not plain `npm install`).
- **No test framework**: The codebase has no unit/integration test suite (no jest, vitest, cypress, etc.). The only automated checks are ESLint and TypeScript (via `next build`).
- **Supabase credentials required**: The app requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. Without real Supabase credentials the build succeeds and UI renders, but auth/data flows will fail at runtime. The `/api/health` endpoint works without credentials. The `/smoke` page shows env status.
- **No `.nvmrc`**: No Node version pinned. Node 22.x works. Next 14 requires >= 18.17.
- **bun.lock exists but bun is not installed**: The project has both `bun.lock` and `package-lock.json`. In this environment use npm with `--legacy-peer-deps`.
