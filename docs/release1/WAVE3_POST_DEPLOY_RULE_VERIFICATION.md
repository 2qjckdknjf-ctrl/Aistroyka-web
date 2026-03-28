# Wave 3 — Post-deploy rule verification

**Date (UTC):** 2026-03-28  
**Runtime:** `buildStamp.sha7` = **`f941d0e`** (`https://www.aistroyka.ai`)

## F1 — Submit without proof

**Expect:** HTTP **400**, body includes `proof_required`.

**Method:** Password grant → Supabase access token; `POST /api/v1/worker/report/create` with `x-client: ios_lite` + `x-idempotency-key`; then `POST /api/v1/worker/report/submit` with new `report_id`, no media.

**Actual:** `HTTP 400` — `{"error":"Photo proof required","code":"proof_required"}`

**Verdict:** **PASS**

## F2 — Lite GET `/api/v1/tasks/:id` (bogus UUID)

**Expect:** Not `403` with `lite_client_path_forbidden` for allowed path; with invalid Bearer → **401**; with valid JWT → **404** for unknown id.

**Commands (abbreviated):**

- Fake Bearer: `401` `Authentication required`
- Valid JWT: `404` `Not found`

**Verdict:** **PASS** (no stale lite allow-list 403 on these paths)

## F3 — Lite GET `/api/v1/reports/:id` (bogus UUID)

Same as F2 — **404** with valid JWT.

**Verdict:** **PASS**

## F4 — Stale behavior

**Stale behavior remaining:** **NO** (for the rules above on `www` at `f941d0e`)
