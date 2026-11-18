# AIS-MATERIAL-008 draft comparison follow-up — closure

**Verdict:** YES (multi-offer compare + fixture baseline; reconciles [Hard audit](acaac85e-534c-4aec-b947-eee31cc345dd) gaps after #473/#474)

## Context
Hard audit found no supplier/draft-comparison domain. Thin requirement+quote drafts (#473/#474) shipped first. This slice closes the audit’s remaining local gaps: immutable comparison, fixture adapter, provenance/expiry/stock flags — still no order/pay/live Search & Fetch.

## Delivered
- Pure `compareSupplierOfferDrafts` via `priceLineTotalMinor` (`material_supply.draft_compare.v1`)
- Fixture adapter `loadFixtureSupplierOffers` (manual baseline, no HTTP)
- `material_supply_draft_comparisons` + POST comparisons / fixture-offers APIs
- Unknown stock ≠ available; expired quotes flagged; missing provenance flagged

## Checks
- vitest draft-comparison.engine: PASS
- tsc / eslint / Aikido: see PR

## Remaining
- Live supplier Search & Fetch → `BLOCKED_EXTERNAL`
- Hybrid ranking UX polish; OWNER_GATE legal/store/billing unchanged
