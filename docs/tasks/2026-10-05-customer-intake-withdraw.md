# Customer intake withdraw — 2026-10-05

AIS-CLIENT-005A: human reject of a draft without creating contracts.

`POST /api/v1/portal/intake/:id/withdraw` moves `draft` → `withdrawn` for the creator. Repeat withdraw is idempotent. Submitted drafts stay submitted. Live table apply remains OWNER_GATE.
