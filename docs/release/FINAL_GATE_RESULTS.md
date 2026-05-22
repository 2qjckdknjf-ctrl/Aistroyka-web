# FINAL GATE RESULTS

Date: 2026-05-22  
Project: AISTROYKA

## Gate matrix

| Gate | Command | Result | Evidence | Failure / note | Remediation |
|---|---|---|---|---|---|
| Dependency install | `bun install` | PASS | completed in local run, lockfile resolved | none | none |
| Lint | `bun run lint` | PASS | `next lint` completed with no warnings/errors | none | none |
| Typecheck | `bunx tsc -p apps/web/tsconfig.json --noEmit` | PASS | exit code `0` | none | none |
| Tests | `bun run test` | PASS | `275` files / `1452` tests passed | none | none |
| Contracts build | `bun run build:contracts` | PASS | `packages/contracts` TypeScript build successful | none | none |
| Web production build | `bun run build:web` | PASS | Next.js build successful (full log in agent output artifact) | none | none |
| Cloudflare production build | `bun run cf:build` | PASS | OpenNext/Cloudflare build successful (full log in agent output artifact) | none | none |
| Migration sanity | MCP `list_migrations` | PASS | migrations listed successfully from live Supabase project | none | none |
| Env/config readiness | `bun run release:check` | PASS_WITH_WARNINGS | report generated: `reports/release-hardening/release-readiness-check.md` | warning-level findings only | track warnings in operator backlog |
| Stakeholder finance sanity | `bash scripts/verify/stakeholder_finance_sanity.sh` | PASS | `PASS: stakeholder costs denied; portal JSON keys OK` | none | none |
| Pilot prereq strict check | `bun run smoke:pilot:check --strict` | FAIL | missing `AUTH_HEADER/COOKIE` or smoke creds, missing `E2E_EMAIL/E2E_PASSWORD`, missing `SUPABASE_ACCESS_TOKEN` | external env readiness gap | supply required operator env/secrets, rerun strict prereq and then `pilot_launch.sh` |
| Final release council | `gh workflow run release-go-no-go-council.yml --ref main -f run_stakeholder_sanity=true` + watch run `26271634288` | PASS | workflow `Release GO/NO-GO Council` run `26271634288` successful incl. stakeholder sanity | none | none |

## Unavailable / skipped commands

- No dedicated standalone `typecheck` script exists in root `package.json`; equivalent TypeScript check executed directly with `bunx tsc`.
- No dedicated "Vercel production build" script exists in root. `bun run build:web` (Next production build) executed as functional equivalent for web build gate.

## Gate summary

- Passed: dependency install, lint, typecheck, tests, contracts build, web build, cf:build, migration sanity, release check, stakeholder sanity, release council.
- Failed: strict pilot prereq check (external env/auth inputs missing).
- Blocker class for failed gate: **operator/env** (not code regression).
