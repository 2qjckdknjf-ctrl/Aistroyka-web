# Reports Export UI Validation — 2026-06-20

| Command | Result | Notes |
|---|---|---|
| `bun install --frozen-lockfile` | PASS | Preflight install completed. |
| `bun run --cwd apps/web test components/projects/reports-export-ui.test.ts --run` | PASS | 1 file, 3 tests. |
| `bun run i18n:check` | PASS | en/ru/es/it parity for checked namespaces. |
| `bun run lint` | PASS | ESLint completed. |
| `bun run build:contracts` | PASS | Contracts package compiled. |
| `bun run test -- --run` | PASS | 296 test files, 1526 tests. |
| `bun run build` | PASS | Regular build completed. |
| `bun run cf:build` | PASS | Cloudflare/OpenNext build completed; no deploy. |

## Final Status
- Validation: PASS.
- Known `package-lock.json` install metadata side effect appeared and was reverted before commit.
