# Wave 4 Step 6 — Integration (Stage F)

## F1 — Portal visibility

- `getClientProjectView` includes `client_requests` (non-cancelled, public projection) so stakeholders see requests with the rest of the curated portal payload.

## F2 — Manager surfaces

- Project detail hosts **Client requests** panel next to **Client portal** settings.

## F3 — Document / milestone linkage

- Optional `linked_entity_type` / `linked_entity_id` stored and shown as a short hint (type + truncated id) — does not auto-sync document approval state (explicit scope).

## F4 — Not in scope

- No messaging fan-out, no notifications subsystem changes in this step.
