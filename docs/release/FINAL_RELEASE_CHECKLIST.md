# Final Release Checklist (Audit Pass 2026-05-01)

## Operator smoke (staging / production)

**2026-05-08:** With password-grant or JWT env as documented in `scripts/smoke/pilot_launch.sh`, **full** pilot smoke **PASS** on `https://staging.aistroyka.ai` and `https://aistroyka.ai` (health, config, cron-tick, ops/metrics). Without auth, `ops/metrics` remains **401** by design.

**Preflight (no credentials printed):** from repo root run `bun run smoke:pilot:check` (or `bash scripts/smoke/check_pilot_prereqs.sh`). Use `--strict` to fail if `ops/metrics` auth inputs are missing.

When credentials and tenant auth context are available:

```bash
BASE_URL=https://staging.aistroyka.ai bash scripts/smoke/pilot_launch.sh
BASE_URL=https://aistroyka.ai bash scripts/smoke/pilot_launch.sh
```

Use `AUTH_HEADER`, `COOKIE`, or `SMOKE_EMAIL`/`SMOKE_PASSWORD` as documented in `scripts/smoke/pilot_launch.sh` — `ops/metrics` requires a **Supabase user JWT** or session cookie (not service_role).

## Code Health Gates

**Last credentialed smoke (2026-05-08):** full `pilot_launch.sh` **PASS** staging + production when `ops/metrics` auth inputs are set per `scripts/smoke/pilot_launch.sh`.

**Last Playwright pilot:** **PENDING re-run** after FirstLaunchGuide + core-flow fixes (`FINAL_E2E_REPORT.md`).

- [x] `bun install --frozen-lockfile`
- [x] Typecheck (`bunx tsc -p apps/web/tsconfig.json --noEmit`)
- [x] Lint (`bun run lint`)
- [x] Tests (`bun run test`)
- [x] Build (`bun run build`)
- [x] Cloudflare build (`bun run cf:build`)

## API / Data Safety

- [x] `/api/v1/*` canonical surface verified
- [x] Worker critical flow routes verified
- [x] Required core tables present in migrations
- [x] RLS enable statements present for core tables
- [x] Duplicate migration timestamp copies removed (`(1)` files)

## Mobile

- [x] iOS Worker simulator build
- [x] iOS Manager simulator build
- [x] Android debug assemble
- [ ] Real-device smoke and push/auth media flow verification

## Security / Ops

- [x] Middleware and tenant guard audit
- [x] Shell smoke scripts syntax validated
- [x] CI/deploy workflow presence verified
- [x] Live staging smoke with real secrets executed (**2026-05-08** credentialed run; repeat after material deploys)
- [x] Live production smoke with real secrets executed (**2026-05-08** credentialed run; repeat after material deploys)

## Pre-Deploy Operator Commands

```bash
cd /Users/alex/Projects/AISTROYKA
bun install --frozen-lockfile
bun run lint
bun run test
bunx tsc -p apps/web/tsconfig.json --noEmit
bun run build
bun run cf:build
bash scripts/smoke/pilot_launch.sh
```

## Go/No-Go Rule

- Go only if all checked boxes are complete and no P0/P1 remains.
