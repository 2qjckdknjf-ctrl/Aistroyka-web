# Final Release Checklist (Audit Pass 2026-05-01)

## Code Health Gates

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
