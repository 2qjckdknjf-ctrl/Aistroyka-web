# Frontend Current Validation — 2026-06-20

## Commands Run

| Command | Result | Notes |
|---|---|---|
| `bun install --frozen-lockfile` | PASS | Postinstall completed. |
| `bun run lint` | PASS | ESLint completed. |
| `bun run build:contracts` | PASS | Contracts compiled. |
| `bun run i18n:check` | PASS | Checked namespaces match. |
| `bun run test -- --run` | PASS | 294 test files, 1520 tests. |
| `bun run build` | PASS | Regular build completed. |
| `bun run cf:build` | PASS | Cloudflare/OpenNext build completed; no deploy. |
| `bun run smoke:pilot` | BLOCKED | No local server/env; `localhost:3000` returned HTTP 000. |
| `bun run smoke:frontend` | UNAVAILABLE | Root script not defined. |

## Available UI / E2E Scripts
- root:
  - `smoke:pilot`
  - `smoke:pilot:check`
  - `audit:pilot`
  - `audit:e2e`
- `apps/web`:
  - `e2e`
  - `e2e:pilot`
  - `test:e2e`
  - `smoke:auth`
  - `smoke:staging`
  - `smoke:prod`

## Notes
- No new UI validation script was created.
- No browser screenshots were captured in this audit phase.
- `package-lock.json` install metadata side effect appeared during validation and was reverted.
