# Stage2a A05 commercial quantity bind — closure

**Verdict:** YES (accepted-quantity commercial bind + manager API; contractor-internal only)

## Delivered
- Migration `quantity_commercial_bindings` (RLS: internal tenant writer select/insert)
- `bindAcceptedQuantityCommercial` — fails closed unless A04 decision is `accepted`
- `POST .../quantities/acceptances/:acceptanceId/commercial-bind` owner/admin only
- Uses `commercial.stage2a.v1` pure engine; does not rewrite historical customer estimates
- Lite/worker path not allow-listed; portal/share surfaces do not read this table

## Checks
- vitest `quantity-commercial-bind.test.ts`: PASS (7)
- tsc / eslint: see PR validation
- Hosted migration apply: required after merge on AISTROYKA (`vthfrxehrursfloevnlp`)

## Remaining
- Manager UI for bind (optional follow-up; API complete)
- OWNER_GATE legal/store/billing unchanged
