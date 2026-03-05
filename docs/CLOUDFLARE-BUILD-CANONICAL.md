# Canonical Cloudflare build configuration

**Date:** 2026-03-05

Use these settings so Cloudflare Builds (Pages or Workers) match the repository and GitHub Actions. No npm in the pipeline.

---

## From repository root

| Setting | Value |
|--------|--------|
| **Root directory** | *(empty — repo root)* |
| **Install command** | `bun install --frozen-lockfile` |
| **Build command** | `bun run cf:build` |

- `bun run cf:build` runs root script: `cd apps/web && bun run cf:build` → OpenNext Cloudflare build in apps/web.
- Do **not** use: `cd apps/web && npm install && bun run build` (mixed package manager, wrong build target).

---

## From apps/web (alternative)

If the build UI requires a subdirectory:

| Setting | Value |
|--------|--------|
| **Root directory** | `apps/web` |
| **Install command** | *(leave empty or use:* `cd ../.. && bun install --frozen-lockfile` *)* |
| **Build command** | `cd ../.. && bun run cf:build` **or** `bun run cf:build` if run from root in same job |

Prefer running from repo root so workspace dependencies (e.g. packages/contracts) and root scripts are used consistently.

---

## Environment variables (build-time)

Set in Cloudflare Build → Environment variables (Production / Preview as needed):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (e.g. https://aistroyka.ai for prod, https://staging.aistroyka.ai for staging)
- `NEXT_PUBLIC_APP_ENV` = `production` or `staging` (optional; for UI banner)
- `NEXT_PUBLIC_BUILD_SHA` — usually set by CI (e.g. from git SHA)
- `NEXT_PUBLIC_BUILD_TIME` — usually set by CI

Secrets (runtime): set in Worker → Settings → Variables and secrets (not in build UI).
