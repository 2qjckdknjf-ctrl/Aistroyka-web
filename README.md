# Aistroyka monorepo

Primary web app: **`apps/web`** (Next.js, OpenNext, Cloudflare Workers). Mobile: **`ios/`**, **`android/`**.

## Quick start

```bash
bun install
bun run dev
```

## Build & deploy (Cloudflare)

```bash
bun run build          # contracts + Next production build
bun run cf:build       # OpenNext worker bundle (from repo root)
```

Deploy uses Wrangler from **`apps/web`** (`wrangler.toml`): environments **`dev`**, **`staging`**, **`production`**. Staging worker: `workers_dev = true`; hostname `staging.aistroyka.ai` is configured in the Cloudflare dashboard.

Secrets (optional):

```bash
cd apps/web && ./scripts/set-cf-secrets.sh staging   # reads .env.staging / .env.staging.local
```

## Packages

- **`packages/contracts`** — shared Zod types (workspace).
- **OpenAPI:** archived under `docs/_archive/packages-contracts-openapi/`; regenerate with `bash scripts/generate-openapi.sh`.

## API

Public HTTP API is versioned under **`/api/v1/*`**. Unversioned `/api/...` routes redirect (**307**) to the matching v1 path where applicable.

## Pull requests (merge gate)

The **CI Check** workflow (`.github/workflows/ci-check.yml`) runs on every PR to `main` / `master`: `bun install --frozen-lockfile`, `bun run lint`, `bun run test`, and `bun run cf:build` (OpenNext bundle only — no deploy). **Keep this workflow green before merging** unless there is an explicit exception documented in the PR.

## Docs

- Release 1 summary: `docs/launch/Release1.md`
- Progress / pending: `docs/_reports/release1_progress.md`
