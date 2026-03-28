# Wave 3 — Real positive path report

**Date (UTC):** 2026-03-28

## Scope

Prove a **real** authenticated worker API sequence against production (not random UUID only).

## Worker identity

- **Type:** Supabase **password** user from pilot/smoke env (`SMOKE_EMAIL` / `SMOKE_PASSWORD` in `apps/web/.env.local` — not logged here).
- **Tenant:** Returned in API responses (e.g. `tenant_id` on created report).

## Steps executed (live)

1. `POST https://www.aistroyka.ai/api/v1/worker/report/create`  
   - Headers: `Authorization: Bearer <access_token>`, `x-client: ios_lite`, `x-idempotency-key: <uuid>`, `Content-Type: application/json`  
   - Body: `{}`  
   - **Result:** **200** — draft report created (example id from run: `ba3dfe04-d297-4263-8ecc-2e12ee31007c`).

2. `POST https://www.aistroyka.ai/api/v1/worker/report/submit`  
   - Same client headers + new idempotency key  
   - Body: `{"report_id":"<that id>"}`  
   - **Result:** **400** `proof_required` — **expected** gate before “success” submit.

## Submit with proof (media) — status

**Not executed** in this sprint (would require upload session / `add-media` / storage).  
**Proof of gate:** `proof_required` on submit without media — **demonstrated**.

## Conclusion

| Item | Status |
|------|--------|
| Real create report | **FULL** |
| Real submit without proof blocked | **FULL** |
| Submit with proof → success | **OPEN** (not run) |
