# Integration Checkpoint Validation — 2026-06-20

| Command | Status | Notes |
|---|---|---|
| `bun install --frozen-lockfile` | PASS | Postinstall completed. |
| `bun run lint` | PASS | ESLint completed. |
| `bun run build:contracts` | PASS | Contracts compiled. |
| `bun run i18n:check` | PASS | Checked namespaces match. |
| `bun run test -- --run` | PASS | 294 test files, 1520 tests. |
| `bun run build` | PASS | Regular build completed. |
| `bun run cf:build` | PASS | Cloudflare/OpenNext build completed; no deploy. |
| `bun run smoke:pilot` | BLOCKED | No local server running at `localhost:3000`; health/config/cron/metrics returned HTTP 000. |
| `bun run smoke:frontend` | UNAVAILABLE | Root script not defined. |

## Side Effects
- `package-lock.json` received the known install metadata side effect during validation.
- It was inspected and reverted.
- No lockfile/package changes remain.

## Final Result
- Core validation: GREEN.
- Live/local smoke: blocked/unavailable, not code failure.
