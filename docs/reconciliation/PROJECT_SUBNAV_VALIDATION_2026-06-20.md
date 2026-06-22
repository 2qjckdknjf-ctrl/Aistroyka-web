# Project Subnav Validation — 2026-06-20

| Command | Result | Notes |
|---|---|---|
| `bun install --frozen-lockfile` | PASS | Preflight install completed. |
| `bun run --cwd apps/web test components/projects/ProjectSubnav.test.ts --run` | PASS | 1 file, 2 tests. |
| `bun run lint` | PASS | ESLint completed. |
| `bun run build:contracts` | PASS | Contracts package compiled. |
| `bun run i18n:check` | PASS | en/ru/es/it parity for checked namespaces. |
| `bun run test -- --run` | PASS | 295 test files, 1522 tests. |
| `bun run build` | PASS | Regular build completed. |
| `bun run cf:build` | PASS | Cloudflare/OpenNext build completed; no deploy. |

## Final Status
- Validation: PASS.
- Known `package-lock.json` install metadata side effect appeared and was reverted before commit.
