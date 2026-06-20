# Draft PR Final Validation — 2026-06-20

| Command | Result | Notes |
|---|---|---|
| `bun install --frozen-lockfile` | PASS | Initial install completed. |
| `bun install --force --frozen-lockfile` | PASS | Used to restore local `node_modules` to locked Vitest `4.0.18` after stale local dependency drift caused a parse failure under Vitest `4.1.8`. No repo files changed. |
| `bun run lint` | PASS | ESLint completed. |
| `bun run build:contracts` | PASS | Contracts compiled. |
| `bun run i18n:check` | PASS | Checked namespaces match. |
| `bun run test -- --run` | PASS | 296 test files, 1526 tests. |
| `bun run build` | PASS | Regular build completed. |
| `bun run cf:build` | PASS | Cloudflare/OpenNext build completed; no deploy. |

## Notes
- Playwright browser review is still partial because local Chromium is missing.
- Authenticated browser/staging smoke remains a merge blocker.
- `package-lock.json` install metadata side effect appeared during validation and was reverted.
