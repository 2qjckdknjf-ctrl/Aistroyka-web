# FINAL GATE RESULTS

Date: 2026-05-22  
Project: AISTROYKA

## Gate matrix

| Gate | Command | Result | Evidence | Failure / note | Remediation |
|---|---|---|---|---|---|
| Dependency install | `bun install` | SKIPPED | dependencies already installed for this rerun pass | not needed for rerun | none |
| Lint | `bun run lint` | PASS | `next lint` completed with no warnings/errors in rerun | none | none |
| Typecheck | `bunx tsc -p apps/web/tsconfig.json --noEmit` | PASS | exit code `0` in rerun | none | none |
| Tests | `bun run test` | PASS | `275` files / `1452` tests passed in rerun | none | none |
| Contracts build | `bun run build:contracts` | PASS | `packages/contracts` TypeScript build successful in rerun | none | none |
| Web production build | `bun run build:web` | PASS | successful after script compatibility fix (`build:contracts:npm` command form) | initial rerun attempt failed due Bun parsing `npm run --prefix` | updated root `package.json` script to use `cd packages/contracts && npm run ...` |
| Cloudflare production build | `bun run cf:build` | PASS | OpenNext/Cloudflare build successful in rerun | none | none |
| Migration sanity | MCP `list_migrations` (`project_id=vthfrxehrursfloevnlp`) | PASS | live migration list retrieved successfully | none | none |
| Env/config readiness | `bun run release:check` | PASS_WITH_WARNINGS | report generated: `reports/release-hardening/release-readiness-check.md` | warning-level findings only | track warnings in operator backlog |
| Stakeholder finance sanity | `STAKEHOLDER_SMOKE_EMAIL=... STAKEHOLDER_SMOKE_PASSWORD=... bash scripts/verify/stakeholder_finance_sanity.sh` | PASS | `PASS: stakeholder costs denied; portal JSON keys OK` | none | none |
| Pilot prereq strict check | `bun run smoke:pilot:check --strict` (with `SMOKE_EMAIL/SMOKE_PASSWORD` + Supabase URL/anon env) | PASS | strict metrics-auth path passes | non-strict warnings remain for `E2E_*` and `SUPABASE_ACCESS_TOKEN` | provide remaining env for full pilot e2e/operator pack |
| Final release council (baseline) | run `26271634288` | PASS | previously closed stakeholder gate remained green | none | none |
| Final release council replay | `gh workflow run release-go-no-go-council.yml --ref release/publication-readiness-mega-sprint -f run_stakeholder_sanity=true` + watch run `26273351280` | PASS | replay workflow succeeded incl. `Run stakeholder finance sanity` | none | none |

## Unavailable / skipped commands

- No dedicated standalone `typecheck` script exists in root `package.json`; equivalent TypeScript check executed directly with `bunx tsc`.
- No dedicated "Vercel production build" script exists in root. `bun run build:web` (Next production build) executed as functional equivalent for web build gate.

## Gate summary

- Passed: lint, typecheck, tests, contracts build, web build, cf:build, migration sanity, stakeholder sanity, strict pilot prereq, release council baseline, release council replay.
- Passed with warnings: `release:check`.
- Skipped by policy: `bun install` (not required in rerun).
- Remaining operator gaps (non-gate-blocking for strict check): `E2E_*` and `SUPABASE_ACCESS_TOKEN` for full pilot e2e/operator signoff bundle.
