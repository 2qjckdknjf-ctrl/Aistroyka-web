# Deploy fix summary

## Problem

Build succeeded; deploy failed with: **The entry-point file at '.open-next/worker.js' was not found.**

## Root cause

- **Worker is generated only under apps/web:** `apps/web/.open-next/worker.js` (OpenNext runs in `apps/web`).
- **Root has its own wrangler.toml** with `main = ".open-next/worker.js"` (path relative to root).
- When deploy ran from **repository root**, wrangler used **root** `wrangler.toml` and looked for `.open-next/worker.js` at root → file does not exist → error.

## Fix (minimal, config/scripts only)

1. **Run deploy from apps/web** (or a root script that `cd`s into `apps/web` then runs wrangler).
2. **Use explicit `--env production`** (or `--env staging`) and **`--config wrangler.toml`** so `apps/web/wrangler.toml` is used (entrypoint `worker-bootstrap.js` → `.open-next/worker.js` under apps/web).
3. **Root wrangler.toml:** Comment added that production deploy must run from apps/web; root config is not used for production.
4. **Root package.json:** Added `cf:deploy:prod` and `cf:deploy:staging` that run the correct command from apps/web.
5. **GitHub Actions:** Already use `working-directory: apps/web` and `--config wrangler.toml` and `--env`; left as-is, optionally clarified in comments.

## Exact production deploy command

From repo root:

```bash
cd apps/web && npx wrangler deploy --env production --config wrangler.toml
```

Or use from root: `bun run cf:deploy:prod` (runs the above via apps/web script).

## Files changed

- `package.json` (root): added `cf:deploy:prod`, `cf:deploy:staging`.
- `wrangler.toml` (root): added top comment that production deploy must run from apps/web.
- `.github/workflows/deploy-cloudflare-prod.yml`: comment clarifying working-directory and config.
- `.github/workflows/deploy-cloudflare-staging.yml`: same.
- `docs/deploy-fix/00_DEPLOY_FIX_SUMMARY.md` (this file).
- `reports/deploy-fix/root-cause.md`, `reports/deploy-fix/final-deploy-command.md`.

## Deploy verification note

- **Build:** From root run `bun run cf:build`; then `apps/web/.open-next/worker.js` and `apps/web/.open-next/assets` must exist.
- **Deploy:** From root run `bun run cf:deploy:prod` or `cd apps/web && npx wrangler deploy --env production --config wrangler.toml`. Wrangler runs with cwd `apps/web`, loads `apps/web/wrangler.toml`, entrypoint `worker-bootstrap.js` → imports `./.open-next/worker.js` (both under apps/web). Path resolution is correct.
- **Cloudflare Builds (Dashboard):** Set deploy command to `cd apps/web && npx wrangler deploy --env production --config wrangler.toml` (or Root directory = `apps/web` and command = `npx wrangler deploy --env production --config wrangler.toml`). Do not run `wrangler versions upload` from repo root.
