# Runtime Review Preflight — 2026-06-20

## Branch
- Current branch: `integration/aistroyka-full-reconciliation-2026-06-20`
- HEAD before runtime review docs: `c3ec717ca53647b09ae4552a4b6fd82e0579aab8`
- Expected latest commit: `c3ec717c feat: add owner admin reports export UI`

## Working Tree
- Preflight status: clean.
- `bun install --frozen-lockfile`: PASS.

## Env Files Available
Names only, no secrets:
- Integration worktree examples only:
  - `.env.example`
  - `.env.local.example`
  - `.env.e2e.example`
  - `.env.pilot.example`
  - `apps/web/.env.example`
  - `apps/web/.env.local.example`
  - `apps/web/.env.production.example`
  - `apps/web/.env.staging.example`
- Original checkout gitignored env files exist and were used locally without printing values:
  - `.env.local`
  - `.env.pilot`
  - `apps/web/.env.local`

## Runtime Review Possibility
- Local app runtime: AVAILABLE on `http://localhost:3010`.
- Browser unauthenticated check: AVAILABLE.
- Authenticated browser session: BLOCKED; Cursor browser had no authenticated session and secrets were not injected into browser tooling.
- API runtime check: AVAILABLE using gitignored credentials without printing values.
