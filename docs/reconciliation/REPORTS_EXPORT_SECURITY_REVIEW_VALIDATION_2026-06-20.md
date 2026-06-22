# Reports Export Security Review Validation — 2026-06-20

## Commands

| Command | Result | Notes |
|---|---|---|
| `bun install --frozen-lockfile` | PASS | Postinstall completed. |
| `bun run lint` | PASS | ESLint completed. |
| `bun run build:contracts` | PASS | Contracts package compiled. |
| `bun run i18n:check` | PASS | No user-facing string changes. |
| `bun run --cwd apps/web test app/api/v1/reports/export/route.test.ts lib/domain/reports/report-export.service.test.ts --run` | PASS | 2 files, 12 tests. |
| `bun run test -- --run` | PASS | 294 test files, 1516 tests. |
| `bun run build` | PASS | Regular build completed. |
| `bun run cf:build` | PASS | Cloudflare/OpenNext build completed; no deploy. |

## Fixes During Review
- Added role-based export gate for `owner`/`admin`.
- Added invalid query filter handling.
- Added route tests for non-lite `member` role and invalid query filters.
- Fixed test mock isolation so stale calls cannot hide route behavior.

## Side Effects
- Validation again added the known `package-lock.json` install metadata side effect.
- It was inspected and reverted.
- No lockfile is included in the final intended diff.
