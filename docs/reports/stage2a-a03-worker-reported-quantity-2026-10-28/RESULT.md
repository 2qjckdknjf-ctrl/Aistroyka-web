# Stage2a A03 — Worker reported/measured quantity writes

**Date:** 2026-10-28  
**Branch:** `feat/stage2a-a03-worker-reported-quantity-2026-10-28`  
**Verdict:** YES (API adapter; no native UI in this slice)

## Delivered

- `canWriteQuantitySnapshot`: owner/admin any kind; member only `reported`/`measured`
- Quantity snapshots POST uses that policy (replaces broad `canManageTasks`)
- Lite allow-list: GET/POST `/api/v1/projects/:id/quantities/snapshots` for worker clients
- Hermetic policy + lite-allow-list tests

## Checks

| Check | Result |
|---|---|
| vitest write-policy + lite-allow-list | 24 PASS |

## Not in slice

- Native Worker geometry UI
- A04 acceptance / A05 commercial bindings
