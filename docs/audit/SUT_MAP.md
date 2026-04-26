# System Under Test (SUT) — Pilot E2E Audit

Short factual map derived from `docs/SYSTEM_REPOSITORY_MAP.md`, `docs/runbooks/MOBILE_SYNC.md`, `docs/ADR/020-sync-engine-offline-first.md`, root/apps `package.json`, and `apps/web/playwright.config.ts`.

## Monorepo & package manager

- Root `package.json`: `packageManager` is **bun@1.2.15**; workspaces: `apps/web`, `packages/contracts`.
- Root `test`: `bun run build:contracts && bun run --cwd apps/web test` (Vitest in `apps/web`).
- Root `build`: contracts then `apps/web` Next build.
- Canonical web app: **`apps/web`** (Next.js 15 App Router, `[locale]`, route groups like `(dashboard)` are not URL segments).

## Playwright E2E

- Config: `apps/web/playwright.config.ts` — `testDir: ./tests/e2e`, `baseURL` from **`PLAYWRIGHT_BASE_URL`** (default `http://localhost:3000`).
- Today: `webServer` is disabled when `CI` or `PLAYWRIGHT_SKIP_WEB_SERVER` is set; otherwise starts **`npm run dev`** (pilot audit prefers **bun** — see `playwright.config.ts` after audit script lands).
- Traces/screenshots honor **`AUDIT_ARTIFACT_DIR`** when set.

## API surface (audit scope)

- **Canonical:** `/api/v1/*` (health, config, projects, sync, worker, media, devices, billing, admin, etc.). See `docs/SYSTEM_REPOSITORY_MAP.md` §3.
- **Legacy (still present):** `/api/auth/login`, `/api/projects`, etc. E2E login for cookie session uses **`POST /api/auth/login`** (also mirrored at `POST /api/v1/auth/login` if present).
- **Sync (v1):** `GET /api/v1/sync/bootstrap`, `GET /api/v1/sync/changes`, `POST /api/v1/sync/ack`. All require **`x-device-id`**. Without it, handlers return **400** with `Missing x-device-id header` (not 200).
- **409 conflict:** body includes `error`, `code`, `server_cursor`, **`serverCursor`** (alias), `must_bootstrap`, optional `hint`. Recovery: bootstrap, adopt cursor, retry changes/ack (see runbook).
- **Lite idempotency:** `x-client: ios_lite|android_lite` requires **`x-idempotency-key`** on mutating routes including ack; dashboard/browser clients without lite `x-client` are not forced to send idempotency keys.

## Worker / core flow (v1)

- Day: `POST /api/v1/worker/day/start|end`.
- Reports: `POST /api/v1/worker/report/create|add-media|submit`.
- Media: `/api/v1/media/upload-sessions` (+ finalize) as needed.
- Reference: `docs/SYSTEM_REPOSITORY_MAP.md` §3.

## Dashboard URL shape

- Locale prefix: `/{locale}/...` under `apps/web/app/[locale]/(dashboard)/dashboard/**`.
- Examples: `/{locale}/dashboard`, `/{locale}/dashboard/projects`, `/{locale}/dashboard/projects/[id]`, uploads, devices, AI, tasks, etc.

## Smoke scripts (how invoked today)

- **Root `smoke:pilot`:** `bash scripts/smoke/pilot_launch.sh` — checks `GET /api/v1/health`, `GET /api/v1/config`, optional `POST /api/v1/admin/jobs/cron-tick`, tenant `GET /api/v1/ops/metrics` (needs `COOKIE`, `AUTH_HEADER`, or `SMOKE_EMAIL`+`SMOKE_PASSWORD`+Supabase URL/anon key per script header comments). Env: `BASE_URL` / `BASE_URL` default `http://localhost:3000`.
- **Root `smoke:staging` / `smoke:prod`:** `bash apps/web/scripts/smoke-staging.sh` and `bash apps/web/scripts/smoke-prod.sh` (or `bun run smoke:staging` from `apps/web`).
- **Existing E2E audit (separate from `audit:pilot`):** `bun run audit:e2e` → `scripts/audit/run_e2e_audit.sh` (inventory gen, lint, build, local server optional, Playwright subset, `node --test` sync mjs, report).

## ADR-020 (sync)

- Cursor + `change_log`; bootstrap snapshot + deltas + ack; 409 conflicts; idempotency for lite writes; retention implications documented in ADR.
