# Customer intake submit — 2026-10-05

AIS-CLIENT-005A: human confirmation of a draft without creating contracts.

`POST /api/v1/portal/intake/:id/submit` moves `draft` → `submitted` for the creator. Repeat submit is idempotent. Withdrawn drafts stay closed. Live table apply remains OWNER_GATE.
