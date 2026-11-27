# AIS-MATERIAL-008 live smoke — 2026-11-25

Staging runtime `buildStamp.sha7=d84232f` (`GET /api/v1/health`). Browser-like `User-Agent` required (bare Python UA → CF 1010).

## Chain

| Step | HTTP | Result |
|---|---|---|
| Auth password grant (SMOKE_*) | 200 | Bearer OK |
| `POST …/quantities/snapshots` (Q-TILE-FLOOR area 4.2×2.1) | **201** | snapshot `66ab9ea0-…`, calc `47b6a5cd-…`, qty `8.820000` m2 |
| `POST …/calculations/:id/acceptance` `{decision:accepted}` | **201** | acceptance `cb0bcffe-…`, commercially_bindable |
| `POST …/acceptances/:id/material-requirement-draft` | **201** | draft `ec05f306-…`; need `9.702000`, packs `7`, purchase `10.080000` |
| `POST …/requirement-drafts/:id/fixture-offers` | **201** | 2 offer ids |
| `POST …/requirement-drafts/:id/comparisons` | **201** | ranked Fixture Build Supply #1 (`13993` minor) |
| `POST …/quotes` `quote_dated_at=2026-11-25` | **201** | manual quote `806cbd32-…` |
| `POST …/quotes` ISO datetime | **400** | expected — date must be `YYYY-MM-DD` |

Project: `bbcb592b-bdd4-456b-9b33-a1ea3175ba43` (staging list for smoke user).

## Verdict

Read/draft MATERIAL-008 on staging: **PASS**. No order/pay/supplier message. Purchasing/continuous observer remains **OUT OF SCOPE** (P2).

## Explicit non-claims

- Collection GETs for drafts/quantities still absent (create path only).
- Not a commercial bind / purchase proof.
- CF multi-persona and physical device still OWNER_GATE / NOT_RUN.
