# Stage2a A04 quantity acceptance — closure

**Verdict:** YES (decision storage + manager API; not A05 commercial bind)

## Delivered
- `quantity_acceptance_decisions` (append-only, internal RLS)
- `POST .../quantities/calculations/:id/acceptance` for owner/admin
- `commercially_bindable` only when decision=accepted (A05 may use later)

## Checks
- vitest quantity-acceptance: PASS
