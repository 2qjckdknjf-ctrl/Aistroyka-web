# Release 1 — monorepo hardening

## Package layout

- **Removed:** `packages/api-client` (no in-repo consumers; `@aistroyka/api-client` unused in TS).
- **Archived:** `packages/contracts-openapi` → `docs/_archive/packages-contracts-openapi/`. Root workspaces: `apps/web`, `packages/contracts` only. OpenAPI: `bash scripts/generate-openapi.sh`.
- **Archived:** root `audit_prod_smoke_green_v4/` → `docs/_archive/audit_prod_smoke_green_v4/`.

## API

- Canonical HTTP API: **`/api/v1/*`**. Legacy paths under `/api/...` (same resource shape) return **307** to the v1 URL with query string preserved. Exceptions: `POST /api/invite` → `/api/v1/tenant/invite`; `GET /api/_debug/auth` → `/api/v1/debug/auth`.
- Web UI and server login use v1 paths (e.g. `/api/v1/auth/login`, `/api/v1/tenant/*`, `/api/v1/projects/*`).

## Build & test

- **Package manager:** Bun at repo root (`packageManager`, `bun.lock`). `package-lock.json` removed.
- **Build:** `bun install` then `bun run build` (contracts + Next). **`apps/web` `prebuild`** runs `bun run build:contracts` from repo root (no `npm`).
- **Cloudflare bundle:** `bun run cf:build` (root).
- **Vitest:** `apps/web/vitest.zod-shim.ts` + `vitest.config.ts` alias fixes `import { z } from "zod"` under Vitest with zod 3.25+.
- **PR CI:** `.github/workflows/ci-check.yml` runs on pull requests: `bun install --frozen-lockfile`, `bun run lint`, `bun run test`, `bun run cf:build` (no deploy). Treat as the default merge gate.

## Deploy

- **Target:** Cloudflare Workers via `apps/web/wrangler.toml` (`dev` | `staging` | `production`). Staging: `workers_dev = true`; custom host **`staging.aistroyka.ai`** is attached in the Cloudflare Dashboard (Worker routes / custom domains), not declared in `wrangler.toml` (avoids route churn in CI).
- **Secrets:** `apps/web/scripts/set-cf-secrets.sh` reads `.env.staging` / `.env.staging.local` for `staging`, else production env files; uses `bunx wrangler secret put`. Template: `apps/web/.env.staging.example`.
- **Build stamp on staging:** `deploy-cloudflare-staging.yml` exports `NEXT_PUBLIC_BUILD_SHA` / `NEXT_PUBLIC_BUILD_TIME` into the build environment. After deploy, confirm the commit via the workflow **Post-deploy summary** (sha7) or the Cloudflare deployment record. Smoke the app with `GET https://staging.aistroyka.ai/api/v1/health` (canonical health; legacy `/api/health` may 307). Health now exposes optional `buildSha` (sha7), so you can verify runtime build id directly from API response.
- **Local staging deploy:** from repo root, `bun run cf:build` then `bun run cf:deploy:staging` (requires Cloudflare auth and Worker secrets).
- **Staging workflow hardening (repo):** `deploy-cloudflare-staging.yml` supports `workflow_dispatch` with `ref` input and uses patched deploy flow aligned with production: `wrangler deploy --env staging --dry-run --outdir .open-next/deploy` → `node scripts/patch-bundle-require.cjs` → `wrangler deploy --env staging --no-bundle --config wrangler.deploy.toml`.
- **Staging runtime vars (deploy config):** `wrangler.deploy.toml` now defines `[env.staging.vars]` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_APP_URL`) and `main = ".open-next/deploy/worker-bootstrap.js"` for no-bundle staging deploys.
- **Cloud check (2026-04-07, finalized):** direct staging cutover completed. Route `staging.aistroyka.ai/*` points to `aistroyka-web-staging` (no `hiair` proxy). Smoke checks: `/api/v1/health` => 200 (`buildStamp.sha7=b347ab5`), `/ru/login` => 200, unauthenticated `/api/v1/projects` => 401.
- **Remaining CI blocker:** staging workflow still ends red until GitHub secret `PILOT_SMOKE_BEARER_STAGING` is configured; deploy itself succeeds before this secret gate.
- **Removed:** `apps/web/vercel.json`. **Removed GitHub workflows:** root `ci.yml`, `apply-migrations.yml`, `snapshot-backup.yml`, `update-lockfile-linux.yml`, and nested `apps/web/.github/workflows/*`. **Added:** `ci-check.yml` (PR validation). **Kept:** `deploy-cloudflare-prod.yml`, `deploy-cloudflare-staging.yml`, `pilot-smoke.yml`.

## Mobile (scope check)

- **Android Worker:** `release` has `PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO=false`; debug may allow skip unless `-PpilotRealSubmit=true`. `WorkerApi` omits `task_id` when absent (no `null`). **Instrumented smoke:** `WorkerAppLaunchInstrumentedTest` (Compose root exists); run on device/emulator: `./gradlew :AiStroykaWorker:connectedDebugAndroidTest`.
- **iOS Worker:** `WorkerAPI.createUploadSession` requires a non-empty `upload_path` from the API (no client-side `media/{tenant}/{session}` fallback). Shared `CodingKeys` remain documented in `ios/Shared/Sources/Shared/Endpoints.swift`.
- **Crashlytics / push (APNs, FCM):** not fully wired in-repo; requires Firebase / Apple keys and Gradle/Xcode plugin configuration — see `docs/_reports/release1_progress.md`.

## AI engine / Supabase

- **Migrations (repo):** `apps/web/supabase/migrations/20260411120000_release1_analysis_engine.sql` adds (when missing) `media`, `analysis_jobs`, `ai_analysis`, `projects.user_id`, and RPCs `create_analysis_job`, `dequeue_job`, `claim_job_execution`, `complete_analysis_job`, `trigger_analysis`. **Before applying to an existing production project**, diff against the live database: overlapping table/function names may need a manual merge if the remote already diverged from this minimal stack.
- **Migrations applied (live):** `20260407150000_trigger_analysis_rpc` and `20260411120000_release1_analysis_engine` are applied in the connected Supabase project (`vthfrxehrursfloevnlp`) via MCP.
- **Permission hardening (live):** follow-up migration `20260407195000_release1_trigger_analysis_permissions` revokes `trigger_analysis(uuid)` execute from `anon`/`authenticated`/`public`; only `service_role` (plus `postgres`) remains.
- **Web integration:** `create_analysis_job` and `trigger_analysis` are exposed via `lib/api/rpcClient.ts`. New jobs use `create_analysis_job` (e.g. `POST /api/v1/projects/[id]/media/[mediaId]/trigger`). Re-queue by job id: `POST /api/v1/projects/[id]/jobs/[jobId]/trigger` (validates tenant/project, then calls `trigger_analysis` with the service role).
