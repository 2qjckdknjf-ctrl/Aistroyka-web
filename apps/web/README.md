# Aistroyka-web

Next.js app (Cloudflare Workers) for Aistroyka — AI Construction Intelligence.

## Git & branches

- **main** — stable; do not push directly. Work in feature branches (`feature/<name>`) and merge via PR.
- See [CONTRIBUTING.md](./CONTRIBUTING.md) and `docs/cursor/WORK_RULES.md` for workflow.

## Develop & test

- **Dev:** `npm run dev`
- **Lint:** `npm run lint`
- **Tests:** `npm run test` (vitest; see [docs/ai-module.md](docs/ai-module.md))
- **Health check:** `GET /api/health` → `{ ok, db, aiConfigured, openaiConfigured }` (see [docs/unified-system-ai.md](docs/unified-system-ai.md))

## Cloudflare Workers Build

- **Build command:** `bun install --frozen-lockfile && bun run cf:build`
- **Deploy command:** `npx wrangler deploy`
