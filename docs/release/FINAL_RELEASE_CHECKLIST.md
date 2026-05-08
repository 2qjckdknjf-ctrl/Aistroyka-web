# Final Release Checklist (Audit Pass 2026-05-01)

## Operator smoke (staging / production)

**Preflight (no credentials printed):** from repo root run `bun run smoke:pilot:check` (or `bash scripts/smoke/check_pilot_prereqs.sh`). Use `--strict` to fail if `ops/metrics` auth inputs are missing.

When credentials and tenant auth context are available:

```bash
BASE_URL=https://staging.aistroyka.ai bash scripts/smoke/pilot_launch.sh
BASE_URL=https://aistroyka.ai bash scripts/smoke/pilot_launch.sh
```

Use `AUTH_HEADER`, `COOKIE`, or `SMOKE_EMAIL`/`SMOKE_PASSWORD` as documented in `scripts/smoke/pilot_launch.sh` — `ops/metrics` requires a **Supabase user JWT** or session cookie (not service_role).

## Code Health Gates

**Last unauthenticated curl + smoke (2026-05-07):** `GET /api/v1/health` → **200** (staging, apex, `www`). `pilot_launch.sh` **partial**: `health` / `config` / `cron-tick` **PASS**; **`ops/metrics` → 401** until auth env is set — see `docs/audit/LIVE_SMOKE_FINAL_VERIFICATION.md`.

**Last repo verification (developer machine, 2026-05-08):** `bun run test`, `bun run lint`, `bun run build`, and `bun run cf:build` (with `NEXT_PUBLIC_*` exported) all **passed**. Pilot Playwright run blocked on missing `E2E_EMAIL`/`E2E_PASSWORD` — see `docs/product/PHASE13_ROADMAP_CLOSURE.md`.

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
- [ ] Live staging smoke with real secrets executed
- [ ] Live production smoke with real secrets executed

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
