# AIS-MATERIAL-008 inventory — 2026-11-25

Hard audit before expanding purchasing scope (read/draft slice only).

## Verdict

| Surface | Status |
|---|---|
| Requirement draft from accepted quantity | **CODE_PRESENT** |
| Supplier quote draft + fixture offers | **CODE_PRESENT** |
| Immutable draft comparison engine | **CODE_PRESENT** |
| Unit (engine + draft service) | **14 PASS** (2026-11-25) |
| Staging list endpoints (`…/materials/requirement-drafts`) | **ADDED** 2026-11-26 (`GET` collection + Manager list; deploy smoke after merge). Bare `…/quantities` still not a collection — use `…/quantities/snapshots` |
| Purchasing / continuous observer | **OUT OF SCOPE** (P2 / LATER) |

**Do not rebuild** calculator/core. Next live slice needs an existing quantity acceptance on a project, then POST material-requirement-draft → quotes → comparisons.

## Code map

| Path | Role |
|---|---|
| `app/api/v1/projects/[id]/quantities/acceptances/[acceptanceId]/material-requirement-draft/route.ts` | Create draft |
| `…/materials/requirement-drafts/[draftId]/quotes/route.ts` | Quote drafts |
| `…/materials/requirement-drafts/[draftId]/comparisons/route.ts` | Comparisons |
| `…/materials/requirement-drafts/[draftId]/fixture-offers/route.ts` | Fixture supplier offers |
| `lib/domain/materials/draft-comparison.engine.ts` | Pure comparison + negatives |
| `lib/domain/materials/material-requirement-draft.service.ts` | Draft service |

## Explicit non-claims

- No order / pay / supplier message.
- No invented Business prices.
- No staging end-to-end without acceptance fixture.
