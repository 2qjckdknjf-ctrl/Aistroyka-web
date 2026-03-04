# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Aistroyka is a single Next.js 14 app at `apps/web/` — no microservices, no Docker. The root `package.json` scripts all delegate to `apps/web/`. External dependencies: **Supabase** (auth/DB/storage) and **OpenAI API** (vision analysis).

### Running the dev server

```bash
cd /workspace/apps/web && npx next dev --port 3000
```

The app redirects unauthenticated users to `/ru/login`. Health check: `curl http://localhost:3000/api/health`.

### Environment variables

Copy `.env.local.example` to `.env.local` in `apps/web/`. The Supabase URL and anon key are pre-populated in the example. For local dev, set `NEXT_PUBLIC_APP_URL=http://localhost:3000`. For AI features, `OPENAI_API_KEY` must be a real key (placeholder will pass health check but AI analysis will fail).

### Linting

ESLint must be run from `apps/web/` with `--no-eslintrc --config .eslintrc.json` to avoid a cascading config conflict with the root `.eslintrc.json`:

```bash
cd /workspace/apps/web && npx eslint --no-eslintrc --config .eslintrc.json --ext .ts,.tsx,.js,.jsx app/ lib/ components/
```

The root `next lint` command fails due to duplicate `@next/next` plugin resolution between root and `apps/web` `node_modules`.

### Testing

- **Unit tests**: `cd /workspace/apps/web && npx vitest run` — 85+ tests pass. Note: vitest picks up Playwright `.spec.ts` files from `audit_*` directories which produce expected errors (not real failures).
- **E2E tests**: `cd /workspace/apps/web && npx playwright test` — requires a running dev server and Playwright browsers installed (`npx playwright install chromium`).
- Pre-existing failures in `app/api/analysis/process/route.test.ts` (5 tests) — the test expectations are out of sync with the route implementation (route guards on `SUPABASE_SERVICE_ROLE_KEY` before reaching mocked logic).

### Dependencies

Install with `--legacy-peer-deps` due to `@opennextjs/cloudflare` requiring Next.js 15+ while the project uses 14.2.18:

```bash
cd /workspace/apps/web && npm install --legacy-peer-deps
```

Do **not** install root `node_modules` — it creates ESLint plugin conflicts. All development happens in `apps/web/`.

### Git hooks

Husky pre-commit hook runs `lint-staged` (ESLint `--fix` on staged `.ts/.tsx/.js/.jsx` files). Husky is configured in `apps/web/.husky/`.
