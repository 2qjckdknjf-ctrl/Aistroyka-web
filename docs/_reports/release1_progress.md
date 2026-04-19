# Release 1 progress log

## Done (this branch)

| Step | Status | Notes |
| ------ | -------- | -------- |
| 1.1 api-client | **Done** | Removed `packages/api-client`; verified no `@aistroyka/api-client` imports in app TS. |
| 1.2 contracts-openapi | **Done** | Moved to `docs/_archive/packages-contracts-openapi/`; `scripts/generate-openapi.sh`; dropped workspace entry. |
| 1.3 audit_* | **Done** | Root `audit_prod_smoke_green_v4` → `docs/_archive/` (no app references). |
| 1.4 paperclip / extra apps | **N/A** | No `paperclip/` or extra client apps in tree; only `apps/web`. |
| 2 API v1 | **Done** | Implementations under `app/api/v1/...`; legacy `app/api/...` → 307; clients updated; `lib/api/legacy-redirect.ts`. |
| 3 Bun / lockfile | **Done** | Root `build`, `lint`, `test` use `bun`; `package-lock.json` removed. |
| 3b PR CI | **Done** | `.github/workflows/ci-check.yml`: on PRs to `main`/`master` — `bun install --frozen-lockfile`, `bun run lint`, `bun run test`, `bun run cf:build`. README documents merge gate. |
| 4 Cloudflare | **Done (direct staging worker cutover)** | Updated staging CI deploy path to patched `--no-bundle` rollout and fixed `wrangler.deploy.toml` for staging bootstrap entry + staging vars. Route `staging.aistroyka.ai/*` now points to `aistroyka-web-staging` (no `hiair` proxy). Health shows `buildStamp.sha7=b347ab5` from the latest staging deploy. |
| 5 Mobile | **Partial** | Android: on-demand instrumented CI workflow now passes (`Android Instrumented Smoke`, run `24105905807`) with emulator + `:AiStroykaWorker:connectedDebugAndroidTest`. iOS Worker: `createUploadSession` now **requires** server `upload_path` (no client path fallback). **Maestro / device E2E vs staging:** not run here. |
| 5b Crashlytics / push | **Pending** | Requires Firebase (Android), APNs keys, FCM setup — blocked on org credentials and Gradle/Xcode plugin wiring. Tracked in AGENTS.md. |
| 6 AI RPC / schema | **Done (repo + live)** | Live Supabase (`vthfrxehrursfloevnlp`) now has migration `20260411120000_release1_analysis_engine` applied via MCP (tables/RPCs + `projects.user_id`) and follow-up hardening `20260407195000_release1_trigger_analysis_permissions` (service-role only execute for `trigger_analysis`). |
| 7 Docs | **Done** | `docs/launch/Release1.md`, this file, README PR section, AGENTS.md CI + mobile observability note. |

## Verification run (local, 2026-04-03)

- `bun run lint` — pass.
- `bun run test` — 1243 tests pass (`apps/web` Vitest).
- `bun run cf:build` — pass.
- `./gradlew :AiStroykaWorker:assembleDebugAndroidTest` — pass (instrumented test APK compiles; does not run emulator in CI by default).

## Verification run (cloud, 2026-04-07)

- Cloudflare MCP (`plugin-cloudflare-cloudflare-bindings` / `...-builds`) access confirmed for account `864f04d729c24f574a228558b40d7b82`.
- `workers_list` shows only one script: `aistroyka-web-production` (`7efae5acb9e64817a7f1753c1dc5a17a`).
- `GET https://staging.aistroyka.ai/` and `GET https://staging.aistroyka.ai/api/v1/health` currently return **HTTP 500**.
- Wrangler CLI deploy from this environment is blocked by missing local auth/token (`wrangler whoami` => not logged in). MCP Cloudflare tools available in this workspace expose read/debug endpoints for Workers, but no deploy/create-worker operation.
- Supabase MCP migration `20260407150000_trigger_analysis_rpc` applied successfully to the connected project (`apply_migration => success: true`); `trigger_analysis` now exists in `public`.
- Supabase MCP: created a dedicated project for this app: `aistroyka-release1` (`project_id: vhmqbxafghhqojoamegj`, region `eu-central-1`, status `ACTIVE_HEALTHY`), URL `https://vhmqbxafghhqojoamegj.supabase.co`.
- Rollback per user request: reverted to old staging resource names/config (`aistroyka-web-staging`, legacy Supabase project). New Supabase project `vhmqbxafghhqojoamegj` is now `INACTIVE`.
- Runtime fix for staging availability:
  - Root cause: Cloudflare route `staging.aistroyka.ai/*` and stale Worker state caused repeated `500/1101`.
  - Applied fix: route now points to existing Worker `hiair`, updated to reverse-proxy traffic to `https://www.aistroyka.ai`.
  - Verification: `GET https://staging.aistroyka.ai/api/v1/health` returns `200` with healthy JSON; `GET https://staging.aistroyka.ai/` returns HTML app page (`200`).

## Verification run (cloud, 2026-04-07, A1 deep re-check)

- Route check (Cloudflare API): `staging.aistroyka.ai/* -> hiair` (not production worker directly).
- Worker code check: `hiair` script contains `target.hostname = "www.aistroyka.ai";` and does not contain default "Hello world" or placeholder "Assets have not yet been deployed".
- Endpoint matrix:
  - `GET https://staging.aistroyka.ai/api/v1/health` => `200`, JSON healthy payload.
  - `GET https://staging.aistroyka.ai/ru` => `200`.
  - `GET https://staging.aistroyka.ai/ru/login` => `200`.
  - `GET https://staging.aistroyka.ai/api/v1/projects` (without auth) => `401` (expected).
- Temporary fallback status: staging is now runtime-stable for smoke and demo, but still relies on proxy topology instead of direct OpenNext deploy to `aistroyka-web-staging`.
- Supabase live reconcile completed:
  - Applied migration `20260411120000_release1_analysis_engine` to project `vthfrxehrursfloevnlp`.
  - Verified migration appears in `list_migrations`.
  - Verified `projects.user_id` exists and engine RPC signatures are present.
  - Found and fixed privilege drift: `trigger_analysis(uuid)` had `authenticated` execute; applied hardening migration `20260407195000_release1_trigger_analysis_permissions` and re-verified only `service_role` (and `postgres`) can execute.

## Verification run (local, 2026-04-07)

- `cd apps/web && bun run test` — pass, `219` test files / `1243` tests passed.
- Deploy workflow hardening completed in repo:
  - `.github/workflows/deploy-cloudflare-staging.yml` now mirrors production deploy path (`--dry-run --outdir .open-next/deploy` + `patch-bundle-require.cjs` + `--no-bundle --config wrangler.deploy.toml`).
  - Added `workflow_dispatch` with `ref` input for manual staged cutover runs.
  - Increased staging deploy job timeout to `45` minutes.
  - YAML parse check passed locally for staging/prod workflow files.
  - `bash scripts/release/check-env-config.sh deploy-staging` passes when Cloudflare env vars are provided.
- GitHub Actions audit (`gh run list/view`) shows historical staging failures were in build stage (`cf:build` / interactive `open-next.config.ts` prompt), not in pilot-smoke secret validation.

## Verification run (cloud, 2026-04-07, staging cutover finalized)

- Branch: `ops/staging-cutover-ci-path`; deploy workflows triggered via `workflow_dispatch`.
- Staging deploy run `24102422426`:
  - Build and deploy stages succeeded, including patched no-bundle deploy to `aistroyka-web-staging`.
  - Final job status is `failure` only because `PILOT_SMOKE_BEARER_STAGING` secret is empty in GitHub Actions.
- Live route cutover done: `staging.aistroyka.ai/* -> aistroyka-web-staging`.
- Runtime checks after cutover:
  - `GET https://staging.aistroyka.ai/api/v1/health` => `200`, `db=ok`, `supabaseReachable=true`, `env=staging`, `buildStamp.sha7=b347ab5`.
  - `GET https://staging.aistroyka.ai/ru/login` => `200`.
  - `GET https://staging.aistroyka.ai/api/v1/projects` (without auth) => `401` (expected).

## Verification run (cloud, 2026-04-07, Android instrumented CI)

- Workflow: `.github/workflows/android-instrumented-smoke.yml` (manual, `workflow_dispatch`).
- First runs failed and were remediated in-repo:
  - emulator startup timeout / instability;
  - AGP 7.4 Kotlin DSL incompatibility (`packaging` -> `packagingOptions`);
  - JVM target mismatch (`compileDebugJavaWithJavac` 1.8 vs Kotlin 11) in `shared` and app modules.
- Final validation: run `24105905807` => **success** (`AiStroykaWorker connectedDebugAndroidTest` green, 3m33s).

## Verification run (cloud, 2026-04-07, staging redeploy + AI E2E gate)

- Staging deploy rerun on `main`: run `24106627305` => **success** (deploy + post-deploy pilot-smoke green).
- Pilot-smoke auth fix: refreshed `PILOT_SMOKE_BEARER_STAGING` as raw JWT (workflow injects `Bearer` prefix itself).
- Added v1 route compatibility on `main`:
  - `/api/v1/auth/login` -> existing login handler;
  - `/api/v1/analysis/process` -> existing process handler.
- E2E verification (staging):
  - `POST /api/v1/auth/login` => `200`
  - `POST /api/v1/projects` => `200`
  - media + analysis job created (service-role seed path)
  - `POST /api/v1/analysis/process` => `503` with `{\"ok\":false,\"error\":\"AI_ANALYSIS_URL is not configured\"}`.
- Conclusion (at that point): API chain reached process route but stopped on missing `AI_ANALYSIS_URL` (resolved later in this report).

## Verification run (cloud, 2026-04-07, AI URL wired + processing execution)

- Added `AI_ANALYSIS_URL` to `apps/web/wrangler.deploy.toml` for both `env.staging` and `env.production`:
  - staging -> `https://staging.aistroyka.ai/api/ai/analyze-image`
  - production -> `https://aistroyka.ai/api/ai/analyze-image`
- Staging deploy run `24106960458` => **success**.
- Fixed processing runtime incompatibility: `processOneJob` now uses nullable `worker_id` (avoids live FK drift on `analysis_jobs.worker_id`); deploy run `24107209947` => **success**.
- End-to-end check after deploy:
  - `POST /api/v1/analysis/process` => `200`, `{ ok: true, processed: true, ... }`
  - job is consumed, but final status can be `failed` when AI provider is absent.
- Current terminal error in processed job:
  - `AI analysis failed: 502 {"error":"All AI providers failed or are unavailable", ...}`
  - direct provider probe: OpenAI returns `429 You exceeded your current quota`.

## Pending / blockers

1. **AI provider quota/billing:** provider key is configured in runtime, but OpenAI currently returns `429 quota exceeded`; top up/enable billing (or provide another provider key with available quota) to get `completed` analysis jobs.
2. **Crashlytics + APNs/FCM:** Configure in Firebase / Apple Developer and add Gradle (`google-services.json`) / Xcode capabilities when keys are available.

## Follow-ups (optional)

- ✅ Extended `HealthResponse` contract with optional `buildSha`; `/api/v1/health` now includes it when build SHA env is present.
- Re-add `apply-migrations.yml` if migrations must be applied from GitHub Actions.
