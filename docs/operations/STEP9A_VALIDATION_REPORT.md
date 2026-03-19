# Step 9A — Validation report

**Date:** 2026-03-16

## Commands run

| Command | Result |
|---------|--------|
| `npm run build` (repo root) | **FAIL** — `Failed to load native binding` when loading `next.config.js` / Next build (SWC). |
| `npx tsc --noEmit` (apps/web) | **PASS** |
| `bun test lib/operations/manager-intelligence-operational.test.ts` | **PASS** (2 tests) |

## Manual scenarios (documented; not executed in automated browser here)

| Scenario | Expected |
|----------|----------|
| Manager opens Intelligence | Banner shows state; thin vs low-confidence labels differ; copy ID works |
| Admin opens AI runtime, empty tenant | Empty-state explains window / no traffic |
| Admin with AI traffic | Route histogram + errors |

## Role / access

- Unchanged: admin routes gated; manager intelligence unchanged.

## Unrelated blockers

- **Next.js production build** on agent host: native SWC binding failure — **not attributed to Step 9/9A code**.

## Confidence level

| Layer | Level |
|-------|--------|
| Type safety | **High** |
| Unit tests (operational context) | **High** |
| Production bundle (local agent) | **Not established** |
| E2E | **Not run** |
| **Overall** | **Medium-high** — ship gate should run **CI `next build`** as authority. |
