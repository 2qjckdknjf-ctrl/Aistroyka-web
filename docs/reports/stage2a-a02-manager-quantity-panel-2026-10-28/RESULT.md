# Stage2a A02 — Manager quantity panel

**Date:** 2026-10-28  
**Branch:** `feat/stage2a-a02-manager-quantity-panel-2026-10-28`  
**Depends on:** A01 (#463) + hosted quantity tables  
**Verdict:** YES (thin Manager adapter)

## Scope

- Project Command Center tab `quantities` (canon + detail client)
- `ProjectQuantitiesPanel`: list InputSnapshots; create planned rectangle area snapshot via A01 API
- i18n en/ru/es/it (`canon.projectTabQuantities`, `dashboardDetail.quantities*`)
- No prices, costs, margin, or commercial fields on this surface

## Checks

| Check | Result |
|---|---|
| vitest project-detail-tabs + quantities | 81 PASS |
| `bun run i18n:check` (dashboardDetail) | OK |
| eslint touched TS/TSX | PASS |
| Aikido | 0 issues |

## Not in this slice

- Full geometry editor / zones / deductions UI
- A03 Worker capture, A04 acceptance, A05 commercial bindings
- Polygon / joint / element creators beyond rectangle pilot path

## Verdict

**YES** — Manager can persist and list A01 snapshots without customer-finance exposure.
