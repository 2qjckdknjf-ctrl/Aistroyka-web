# AI Flywheel P2 Hardening Validation

**Date:** 2026-06-17

## Commands run

| Check | Command | Result |
|-------|---------|--------|
| Flywheel + feedback + client tests | `vitest run lib/platform/ai-flywheel lib/features/ai/api lib/ai-brain/phase-d/feedback app/api/v1/ai/feedback/route.test.ts app/api/v1/projects/[id]/copilot/chat/stream/route.test.ts` | **94/94 pass** |
| Lint | `bun run lint` (apps/web) | **pass** |
| i18n | `bun run i18n:check` | **pass** (ru/es/it parity for checked namespaces) |
| Next build | `bunx next build` (apps/web) | **pass** |
| CF build | `bun run cf:build` (root, staging NEXT_PUBLIC_*) | **pass** |
| Export dry-run | `bun scripts/ai/export-dataset-dry-run.ts` | **pass** (export flag false) |

## PATH note

Use arm64 bun: `export PATH="$HOME/.bun/bin:/usr/bin:/bin"` — Volta shim can break vitest on darwin arm64.

## Full vitest suite

Not re-run in this sprint. Pre-existing unrelated failures (e.g. transcribe route 415) remain outside P2 scope. All **changed** test files pass in targeted run above.

## New/changed test coverage

- `app/api/v1/ai/feedback/route.test.ts` — legacy payload, preference payload, malformed optional fields, primary failure path
- `lib/ai-brain/phase-d/feedback/feedback.service.test.ts` — submitFeedback + capture non-blocking
- `lib/features/ai/api/buildPreferencePairFields.test.ts`
- `lib/features/ai/api/submitAiFeedback.test.ts`
- `app/api/v1/projects/[id]/copilot/chat/stream/route.test.ts` — `recordRun` on success

## Verdict

**P2 validation complete:** YES
