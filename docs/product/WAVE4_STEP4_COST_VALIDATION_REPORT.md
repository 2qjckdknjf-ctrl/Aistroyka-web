# Wave 4 Step 4 — Validation (Stage G)

**Date:** 2026-03-28

## Automated tests

| Command | Result |
|---------|--------|
| `npm run test` (`apps/web`, Vitest) | **PASS** — 187 files, 1143 tests |

**Focused additions/updates**

- `lib/domain/costs/cost.repository.test.ts` — extended `getBudgetSummary` (signals, nearing, milestone overruns).
- `lib/domain/costs/cost-signals.test.ts` — pure signal builder.
- `lib/domain/costs/cost.service.test.ts` — mock summary shape.
- `lib/domain/projects/project-status.service.test.ts` — budget attention + health.
- `lib/ai-brain/phase-a/truth-snapshot/project-truth-snapshot.assembler.test.ts` — `ProjectSummary` mock includes budget fields.

## Build

| Command | Result |
|---------|--------|
| `npm run build` (repo root) | **PASS** |

## Manual checks (post-deploy)

- Project with cost lines: summary API shows budget fields; overview card matches Costs tab totals.
- Over-budget scenario: critical attention + signal text; truth snapshot `budget` flag not `unavailable`.
