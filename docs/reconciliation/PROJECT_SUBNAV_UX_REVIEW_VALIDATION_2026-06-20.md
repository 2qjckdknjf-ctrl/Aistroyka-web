# Project Subnav UX Review Validation — 2026-06-20

| Command | Result | Notes |
|---|---|---|
| `bun install --frozen-lockfile` | PASS | Preflight install completed. |
| `bun run --cwd apps/web test components/projects/ProjectSubnav.test.ts --run` | PASS | 1 file, 3 tests. |
| `bun run lint` | PASS | ESLint completed. |
| `bun run build:contracts` | PASS | Contracts compiled. |
| `bun run i18n:check` | PASS | Checked namespaces match. |
| `bun run test -- --run` | PASS | 295 test files, 1523 tests. |
| `bun run build` | PASS | Regular build completed. |
| `bun run cf:build` | PASS | Cloudflare/OpenNext build completed; no deploy. |

## Fixes
- Hardened active state so Overview is not active for hidden/internal tabs.

## Final Status
- Validation: PASS.
- Known `package-lock.json` install metadata side effect appeared and was reverted before commit.
