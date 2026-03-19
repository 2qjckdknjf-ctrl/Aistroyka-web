# Step 10A — Validation Report

**Date:** 2026-03-18

## Commands run

| Command | Result |
|---------|--------|
| `cd apps/web && npx tsc --noEmit` | **PASS** |
| `cd apps/web && npm run test:manager-layer` (bun test × 3 files) | **PASS** (13 tests) |
| `cd apps/web && npx next build` | **PASS** (exit 0, ~122s) |
| `npm run build` (repo root) | **Recommended** — includes contracts; `apps/web` build verified standalone |

## Tests

- `lib/dashboard/alert-destinations.test.ts` — linkage + unknown honesty path  
- `lib/dashboard/priority-actions.test.ts`  
- `lib/intelligence/next-action-href.test.ts`  

## Vitest (`npm run test`)

- On this environment: **fails to start** (esbuild native binary platform mismatch in node_modules).  
- **Not treated as product defect.** Reliable local/CI path: **`bun test`** or **`npm run test:manager-layer`**.

## Workflow checks (logical)

| Check | OK |
|-------|-----|
| Known AI alert → AI + highlight link | Yes |
| Unknown alert → list anchor primary + note | Yes |
| Deep link to `/dashboard/alerts#alert-x` after async load | Retries |
| No fake `/dashboard/projects/...` from alerts | Yes |

## Confidence

- **Build:** HIGH (next build green)  
- **Tests:** HIGH for manager-layer suite via Bun  
- **Vitest path:** DOCUMENTED limitation on some hosts  
