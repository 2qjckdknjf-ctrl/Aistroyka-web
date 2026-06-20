# Validation Baseline After Toolchain Recovery — 2026-06-20

## Script Inspection
- Root `package.json`: inspected.
- `apps/web/package.json`: inspected.

## Results

| Command | Result | Classification | Notes |
|---|---|---|---|
| `bun install --frozen-lockfile` | PASS | toolchain recovered | Node postinstall scripts now execute. |
| `bun run lint` | PASS | baseline pass | ESLint completed for app/components/lib/middleware. |
| `bun run build:contracts` | PASS | baseline pass | Contracts package compiled with `tsc`. |
| `bun run i18n:check` | PASS | baseline pass | ru/es/it match checked en namespaces. |
| `bun run test -- --run` | PASS | baseline pass | 292 test files, 1504 tests passed. |
| `bun run build` | PASS | baseline pass | Regular build completed. |
| `bun run cf:build` | PASS | baseline pass | Cloudflare/OpenNext build completed; no deploy. |
| `bun run smoke:pilot:check` | INCOMPLETE | environment prerequisites missing | Missing tenant auth, E2E credentials, Supabase access token. |
| `bun run smoke:pilot` | FAIL | environment/runtime prerequisite | Defaulted to `http://localhost:3000`; no local server was running, so health/config/cron/metrics calls returned HTTP 000. |
| `bun run smoke:frontend` | UNAVAILABLE | script missing | No root script named `smoke:frontend`. |

## Unexpected File Change
- `package-lock.json` was modified by install/build tooling to add the already-declared root `engines` block.
- The diff was inspected.
- The lockfile side effect was reverted.
- Final Git status after cleanup: clean before docs were added.

## Baseline Verdict
- Local validation tooling is recovered.
- Core baseline gates pass: install, lint, contracts, i18n, tests, build, `cf:build`.
- Live/local smoke remains blocked by environment prerequisites, not by code.
